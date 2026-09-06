FROM node:24.20.0-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# `prisma generate` runs via postinstall here, so the schema must exist before
# npm ci runs — otherwise Prisma fails immediately with "Could not find Prisma
# Schema", regardless of base image or DATABASE_URL.
COPY prisma ./prisma
# Prisma also resolves every env("...") reference in schema.prisma at parse
# time for ANY command, so DATABASE_URL needs to at least be set (not
# necessarily valid/reachable) even though generate never connects to a
# database. The real value comes from Coolify at container runtime and
# overrides this.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
# On failure, dump npm's debug log so the real error is visible in the build
# log instead of just "exit code 1".
RUN npm ci || (cat /root/.npm/_logs/*-debug-*.log 2>/dev/null; exit 1)

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone server + static assets — output tracing includes only the
# production deps actually imported by the app (e.g. @prisma/client).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The `prisma` CLI is a devDependency never imported by app code, so output
# tracing drops it. Copy it explicitly so docker-entrypoint.sh can run
# `prisma migrate deploy` at container startup.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
