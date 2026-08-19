-- CreateTable: CertificateTemplate
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "backgroundImage" TEXT,
    "headerText" TEXT,
    "bodyText" TEXT,
    "footerText" TEXT,
    "signatureText" TEXT,
    "signatureImage" TEXT,
    "logoImage" TEXT,
    "fieldPositions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- AddColumn: Certificate.certificateNo + templateId
ALTER TABLE "certificates" ADD COLUMN "certificateNo" TEXT;
ALTER TABLE "certificates" ADD COLUMN "templateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNo_key" ON "certificates"("certificateNo");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum: TeacherAttendanceStatus
CREATE TYPE "TeacherAttendanceStatus" AS ENUM ('HADIR', 'TERLAMBAT', 'TIDAK_HADIR', 'IZIN', 'SAKIT');

-- CreateTable: TeacherAttendance
CREATE TABLE "teacher_attendances" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "scheduleId" TEXT,
    "branchId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "TeacherAttendanceStatus" NOT NULL DEFAULT 'HADIR',
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeacherPayroll
CREATE TABLE "teacher_payrolls" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "branchId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "ratePerMeeting" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMeetings" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_attendances_teacherId_date_key" ON "teacher_attendances"("teacherId", "date");
CREATE INDEX "teacher_attendances_teacherId_idx" ON "teacher_attendances"("teacherId");
CREATE INDEX "teacher_attendances_branchId_idx" ON "teacher_attendances"("branchId");
CREATE INDEX "teacher_payrolls_teacherId_idx" ON "teacher_payrolls"("teacherId");
CREATE INDEX "teacher_payrolls_branchId_idx" ON "teacher_payrolls"("branchId");

-- AddForeignKey
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_attendances" ADD CONSTRAINT "teacher_attendances_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_payrolls" ADD CONSTRAINT "teacher_payrolls_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teacher_payrolls" ADD CONSTRAINT "teacher_payrolls_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
