-- AlterTable
ALTER TABLE "teacher_attendances" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "teacher_attendances" ADD COLUMN "verifiedBy" TEXT;

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_verifiedBy_fkey" 
  FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
