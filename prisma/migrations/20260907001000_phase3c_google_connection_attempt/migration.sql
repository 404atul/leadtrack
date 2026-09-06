-- CreateTable
CREATE TABLE "GoogleConnectionAttempt" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "customersJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoogleConnectionAttempt_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "GoogleConnectionAttempt_clientId_idx" ON "GoogleConnectionAttempt"("clientId");
-- AddForeignKey
ALTER TABLE "GoogleConnectionAttempt" ADD CONSTRAINT "GoogleConnectionAttempt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
