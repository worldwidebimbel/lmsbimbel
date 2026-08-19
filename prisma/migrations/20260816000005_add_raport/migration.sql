-- CreateTable
CREATE TABLE "raports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "branchId" TEXT,
    "semester" TEXT NOT NULL DEFAULT 'GANJIL',
    "period" TEXT,
    "finalGrade" DOUBLE PRECISION,
    "predicate" TEXT,
    "description" TEXT,
    "teacherNote" TEXT,
    "principalNote" TEXT,
    "attendanceSummary" JSONB,
    "gradeBreakdown" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raports_studentId_idx" ON "raports"("studentId");

-- CreateIndex
CREATE INDEX "raports_classId_idx" ON "raports"("classId");

-- CreateIndex
CREATE INDEX "raports_branchId_idx" ON "raports"("branchId");

-- CreateUnique
CREATE UNIQUE INDEX "raports_studentId_classId_semester_period_key" ON "raports"("studentId", "classId", "semester", "period");

-- AddForeignKey
ALTER TABLE "raports" ADD CONSTRAINT "raports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raports" ADD CONSTRAINT "raports_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raports" ADD CONSTRAINT "raports_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raports" ADD CONSTRAINT "raports_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
