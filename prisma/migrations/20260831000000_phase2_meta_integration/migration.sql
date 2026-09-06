-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "metaPageId" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "leadgenId" TEXT,
ADD COLUMN     "rawPayload" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadgenId_key" ON "Lead"("leadgenId");

