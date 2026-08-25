-- AlterTable: Announcement expansion
ALTER TABLE "announcements" ADD COLUMN "targetBranchIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "announcements" ADD COLUMN "targetProgramIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "announcements" ADD COLUMN "targetClassIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "announcements" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "announcements" ADD COLUMN "attachmentUrl" TEXT;
ALTER TABLE "announcements" ADD COLUMN "startDate" TIMESTAMP(3);

-- AlterTable: Event ranking
ALTER TABLE "events" ADD COLUMN "rankingCriteria" JSONB;
ALTER TABLE "events" ADD COLUMN "autoRanking" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: TeacherPayroll expansion
ALTER TABLE "teacher_payrolls" ADD COLUMN "periodId" TEXT;
ALTER TABLE "teacher_payrolls" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "teacher_payrolls" ADD COLUMN "approvedAt" TIMESTAMP(3);
CREATE INDEX "teacher_payrolls_status_idx" ON "teacher_payrolls"("status");

-- AlterTable: Raport period link
ALTER TABLE "raports" ADD COLUMN "periodId" TEXT;
CREATE INDEX "raports_periodId_idx" ON "raports"("periodId");

-- CreateTable: NotificationTemplate
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WA',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateTable: NotificationLog
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notification_logs_templateId_idx" ON "notification_logs"("templateId");
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- CreateTable: ReportPeriod
CREATE TABLE "report_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "report_periods_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "report_periods_academicYearId_idx" ON "report_periods"("academicYearId");

-- CreateTable: ReportCardDetail
CREATE TABLE "report_card_details" (
    "id" TEXT NOT NULL,
    "raportId" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectName" TEXT NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "gradeLetter" TEXT,
    "teacherComment" TEXT,
    "components" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "report_card_details_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "report_card_details_raportId_idx" ON "report_card_details"("raportId");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_periods" ADD CONSTRAINT "report_periods_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raports" ADD CONSTRAINT "raports_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "report_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report_card_details" ADD CONSTRAINT "report_card_details_raportId_fkey"
    FOREIGN KEY ("raportId") REFERENCES "raports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_payrolls" ADD CONSTRAINT "teacher_payrolls_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "report_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teacher_payrolls" ADD CONSTRAINT "teacher_payrolls_approvedBy_fkey"
    FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
