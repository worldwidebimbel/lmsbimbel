-- CreateTable
CREATE TABLE "exam_sections" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_groups" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "type" "StimulusType" NOT NULL,
    "title" TEXT,
    "passageText" TEXT,
    "audioUrl" TEXT,
    "maxPlayCount" INTEGER,
    "timeLimit" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_groups_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "StimulusType" AS ENUM ('AUDIO', 'READING');

-- AddColumn: Exam.shuffleOptions
ALTER TABLE "exams" ADD COLUMN "shuffleOptions" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn: ExamAttempt.sectionStates
ALTER TABLE "exam_attempts" ADD COLUMN "sectionStates" JSONB;

-- AddColumn: Question.groupId, sectionId, order
ALTER TABLE "questions" ADD COLUMN "groupId" TEXT;
ALTER TABLE "questions" ADD COLUMN "sectionId" TEXT;
ALTER TABLE "questions" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "exam_sections_examId_idx" ON "exam_sections"("examId");
CREATE INDEX "question_groups_examId_idx" ON "question_groups"("examId");
CREATE INDEX "questions_groupId_idx" ON "questions"("groupId");
CREATE INDEX "questions_sectionId_idx" ON "questions"("sectionId");

-- AddForeignKey
ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_groups" ADD CONSTRAINT "question_groups_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "question_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "exam_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
