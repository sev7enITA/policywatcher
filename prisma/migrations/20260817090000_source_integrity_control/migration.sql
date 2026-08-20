ALTER TABLE "Policy" ADD COLUMN "sourceMigrationPending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Policy" ADD COLUMN "sourceMigrationRequestedAt" DATETIME;

CREATE INDEX "Policy_sourceMigrationPending_idx" ON "Policy"("sourceMigrationPending");
