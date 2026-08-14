-- Add DUITKU to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'DUITKU';

-- Add payment fields to Registration table for PPDB payment
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "registrationFee" DOUBLE PRECISION;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
