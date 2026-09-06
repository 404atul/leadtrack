-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "metaAdAccountId" TEXT,
ADD COLUMN     "metaAdAccountName" TEXT,
ADD COLUMN     "metaConnectedAt" TIMESTAMP(3),
ADD COLUMN     "metaPageName" TEXT,
ADD COLUMN     "metaTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "metaUserAccessToken" TEXT;

-- CreateTable
CREATE TABLE "MetaConnectionAttempt" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "encryptedLongLivedToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "pagesJson" JSONB NOT NULL,
    "adAccountsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetaConnectionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetaConnectionAttempt_clientId_idx" ON "MetaConnectionAttempt"("clientId");

-- AddForeignKey
ALTER TABLE "MetaConnectionAttempt" ADD CONSTRAINT "MetaConnectionAttempt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
