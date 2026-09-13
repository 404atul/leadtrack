-- DropIndex
DROP INDEX "Agency_stripeCustomerId_key";

-- DropIndex
DROP INDEX "Agency_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "Agency" DROP COLUMN "currentPeriodEndsAt",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionId",
DROP COLUMN "subscriptionStatus",
DROP COLUMN "trialEndsAt";

-- DropEnum
DROP TYPE "SubscriptionStatus";
