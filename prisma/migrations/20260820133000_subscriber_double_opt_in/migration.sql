ALTER TABLE "Subscriber" ADD COLUMN "confirmationToken" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN "confirmationRequestedAt" DATETIME;
ALTER TABLE "Subscriber" ADD COLUMN "confirmedAt" DATETIME;

CREATE UNIQUE INDEX "Subscriber_confirmationToken_key"
ON "Subscriber"("confirmationToken");
