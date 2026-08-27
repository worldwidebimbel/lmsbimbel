-- Add fields to support rich "learn view" (Bab/chapter sequence + video/article/PPT content) for Material
ALTER TABLE "materials" ADD COLUMN "chapterTitle" TEXT;
ALTER TABLE "materials" ADD COLUMN "chapterOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "materials" ADD COLUMN "content" TEXT;
ALTER TABLE "materials" ADD COLUMN "keyPoints" JSONB;
ALTER TABLE "materials" ADD COLUMN "tips" TEXT;
ALTER TABLE "materials" ADD COLUMN "slideCount" INTEGER;
