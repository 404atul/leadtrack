#!/bin/sh
set -e

echo "Running database migrations..."
# Invoke the real entry point directly instead of `npx prisma` / the
# node_modules/.bin/prisma shim — that shim resolves to this same file via a
# relative path, but got mangled by Docker's cross-stage COPY (its bundled
# prisma_schema_build_bg.wasm loads relative to itself, and the shim ended up
# somewhere that broke that). Calling it directly sidesteps the shim.
node node_modules/prisma/build/index.js migrate deploy

exec "$@"
