-- AddColumn: Question — imageUrl, audioUrl, videoUrl
-- Kolom ini seharusnya sudah ditambahkan saat commit 07d7c75 (CBT Bagian 1),
-- tapi migration SQL tidak pernah dibuat (kemungkinan pakai prisma db push
-- di dev). Production DB tidak punya kolom ini → Prisma error P2022.
ALTER TABLE "questions" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "questions" ADD COLUMN "audioUrl" TEXT;
ALTER TABLE "questions" ADD COLUMN "videoUrl" TEXT;
