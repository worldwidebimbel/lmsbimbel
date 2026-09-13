-- AI Builder — Fase 2: Materi Gambar (future-commit.md §5.1.1)
-- Tambah nilai enum IMAGE ke MaterialType.
-- Catatan: ALTER TYPE ... ADD VALUE aman di dalam transaksi pada PostgreSQL 12+
-- (Supabase menggunakan PG 15+), namun nilai baru tidak dapat dipakai dalam
-- transaksi yang sama — di sini hanya menambah nilai, tidak menggunakannya.

ALTER TYPE "MaterialType" ADD VALUE 'IMAGE';
