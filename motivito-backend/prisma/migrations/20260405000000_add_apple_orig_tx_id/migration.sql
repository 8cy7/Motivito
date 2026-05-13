ALTER TABLE "Subscription" ADD COLUMN "appleOrigTxId" TEXT;
CREATE UNIQUE INDEX "Subscription_appleOrigTxId_key" ON "Subscription"("appleOrigTxId");
