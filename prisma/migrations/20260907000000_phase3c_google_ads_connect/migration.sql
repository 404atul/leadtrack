-- AlterTable
ALTER TABLE "Client" DROP COLUMN "googleAdsCustomerId",
ADD COLUMN     "googleConnectedAt" TIMESTAMP(3),
ADD COLUMN     "googleCustomerId" TEXT,
ADD COLUMN     "googleCustomerName" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleWebhookToken" TEXT;
-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "googleLeadId" TEXT;
-- CreateIndex
CREATE UNIQUE INDEX "Client_googleWebhookToken_key" ON "Client"("googleWebhookToken");
-- CreateIndex
CREATE UNIQUE INDEX "Lead_googleLeadId_key" ON "Lead"("googleLeadId");
