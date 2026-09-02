-- AddGradeLockFields
ALTER TABLE "grades" ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "grades" ADD COLUMN "lockedBy" TEXT;
ALTER TABLE "grades" ADD COLUMN "lockedAt" TIMESTAMP(3);
