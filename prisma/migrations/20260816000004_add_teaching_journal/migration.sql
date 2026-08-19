-- CreateTable
CREATE TABLE "teaching_journals" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "branchId" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "material" TEXT,
    "activity" TEXT NOT NULL,
    "obstacles" TEXT,
    "solution" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_journals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teaching_journals_classId_idx" ON "teaching_journals"("classId");

-- CreateIndex
CREATE INDEX "teaching_journals_teacherId_idx" ON "teaching_journals"("teacherId");

-- CreateIndex
CREATE INDEX "teaching_journals_branchId_idx" ON "teaching_journals"("branchId");

-- AddForeignKey
ALTER TABLE "teaching_journals" ADD CONSTRAINT "teaching_journals_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_journals" ADD CONSTRAINT "teaching_journals_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_journals" ADD CONSTRAINT "teaching_journals_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_journals" ADD CONSTRAINT "teaching_journals_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
