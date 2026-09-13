-- AlterTable: custom_pages
-- Ganti content (HTML text) menjadi sections (JSONB array) + tambah showTitle

-- 1. Tambah kolom sections dengan default kosong agar NOT NULL aman untuk row existing
ALTER TABLE "custom_pages" ADD COLUMN "sections" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Konversi data lama: content HTML dibungkus jadi satu section CONTENT
UPDATE "custom_pages"
SET "sections" = jsonb_build_array(
  jsonb_build_object(
    'type', 'CONTENT',
    'title', '',
    'content', "content",
    'bgColor', '#ffffff',
    'textColor', '#1f2937',
    'maxWidth', '3xl'
  )
);

-- 3. Hapus default (match schema Prisma tanpa default)
ALTER TABLE "custom_pages" ALTER COLUMN "sections" DROP DEFAULT;

-- 4. Tambah showTitle (default true = perilaku lama yang selalu render judul halaman)
ALTER TABLE "custom_pages" ADD COLUMN "showTitle" BOOLEAN NOT NULL DEFAULT true;

-- 5. Hapus kolom content yang sudah tidak dipakai
ALTER TABLE "custom_pages" DROP COLUMN "content";
