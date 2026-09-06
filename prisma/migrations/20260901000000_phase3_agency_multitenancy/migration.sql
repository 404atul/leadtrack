-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");
CREATE UNIQUE INDEX "Agency_stripeCustomerId_key" ON "Agency"("stripeCustomerId");
CREATE UNIQUE INDEX "Agency_stripeSubscriptionId_key" ON "Agency"("stripeSubscriptionId");

-- Backfill: grandfather all existing data into one legacy agency, active (not trial-limited)
INSERT INTO "Agency" ("id", "name", "slug", "subscriptionStatus", "createdAt")
VALUES ('agency-buildthegrowth', 'BuildTheGrowth', 'buildthegrowth', 'active', CURRENT_TIMESTAMP);

-- AlterTable User: add nullable, backfill agency_admin/client_user rows, then index+FK
ALTER TABLE "User" ADD COLUMN "agencyId" TEXT;
UPDATE "User" SET "agencyId" = 'agency-buildthegrowth' WHERE "role" IN ('agency_admin', 'client_user');
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Client: add nullable, backfill, enforce NOT NULL, then index+FK
ALTER TABLE "Client" ADD COLUMN "agencyId" TEXT;
UPDATE "Client" SET "agencyId" = 'agency-buildthegrowth';
ALTER TABLE "Client" ALTER COLUMN "agencyId" SET NOT NULL;
CREATE INDEX "Client_agencyId_idx" ON "Client"("agencyId");
ALTER TABLE "Client" ADD CONSTRAINT "Client_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
