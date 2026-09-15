-- AddColumn: Question — imageUrl, audioUrl, videoUrl
-- Kolom ini seharusnya sudah ditambahkan saat commit 07d7c75 (CBT Bagian 1),
-- tapi migration SQL tidak pernah dibuat (kemungkinan pakai prisma db push
-- di dev). Production DB tidak punya kolom ini → Prisma error P2022.
-- IF NOT EXISTS: idempotent — aman dijalankan ulang bila sebagian kolom
-- sudah terlanjur dibuat dari percobaan migration sebelumnya yang gagal.
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
