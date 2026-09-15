-- AlterTable: subjectId sekarang optional (untuk kelas di luar mapel
-- sekolah — mis. AI Learning Program, Kewirausahaan, dll).
-- Kelas lama yang sudah punya subjectId tetap utuh; kelas baru bisa
-- dibuat tanpa mapel (subjectId = NULL).
ALTER TABLE "classes" ALTER COLUMN "subjectId" DROP NOT NULL;
