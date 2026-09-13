# Guide: AI Builder — Semua Kapabilitas AI Konten

> Satu pintu untuk semua AI pembuatan konten edukatif: materi teks, gambar, aset visual CMS, audio narasi, video pembelajaran, soal, hingga **Paket Bab AI** (satu topik → Bab lengkap dalam hitungan menit).
> Roadmap teknis lengkap ada di `doc/future-commit.md` (khusus Super Admin).

---

## 1. Konsep Dasar

**AI Builder** menggabungkan semua kapabilitas AI konten dalam satu halaman: `/guru/ai-builder`.

| Kapabilitas | Output | Tipe Materi |
|---|---|---|
| Materi Teks | Artikel/ringkasan (markdown-lite, key points, tips) | `TEXT` |
| Materi Gambar | Ilustrasi/diagram edukatif | `IMAGE` |
| Aset Visual CMS (Desain) | Banner, cover program, popup, cover blog, galeri | langsung ke CMS |
| Materi Audio | Narasi TTS (voice Indonesia diprioritaskan) | `AUDIO` |
| Materi Video | Video pembelajaran (composite / direct premium) | `VIDEO` |
| Soal | Soal ujian (PILGAN, essay, menjodohkan, dll.) | ke Bank Soal |
| **Paket Bab AI** | Semua di atas dalam satu Bab | campuran |

**Prinsip moderasi:** semua hasil AI tersimpan sebagai **draft** (`isPublished: false`) — guru wajib review sebelum publish ke siswa. Hasil generate juga otomatis tersimpan ke **Media Manager** (Cloudinary) dan bisa dipakai ulang.

**Prinsip kuota:** tiap kapabilitas punya kuota bulanan per role + rate limit + budget global (diatur Super Admin di tab Pengaturan). Pemakaian terlihat di tab Riwayat.

---

## 2. Prasyarat

- Akun **Guru** ke atas (modul aktif `FEAT_AI_BUILDER`; kapabilitas gambar/desain/audio/video punya flag sendiri)
- Super Admin sudah mengonfigurasi **API key provider** di environment variables server:
  - Teks: `APICLAUDE_API_KEY` (default) atau `OPENROUTER_API_KEY`
  - Gambar: `OPENAI_IMAGES_API_KEY`, atau `OPENROUTER_API_KEY`, atau `REPLICATE_API_KEY` / `STABILITY_API_KEY`
  - TTS: `OPENAI_TTS_API_KEY`, atau `OPENROUTER_API_KEY`, atau `GOOGLE_TTS_API_KEY` / `ELEVENLABS_API_KEY`
  - Video composite: butuh teks + gambar + TTS; video direct: `OPENROUTER_API_KEY`
- **OpenRouter** (`OPENROUTER_API_KEY`) adalah provider serbaguna: satu key untuk teks, gambar, TTS, dan direct video-gen
- Provider aktif per kapabilitas dipilih Super Admin di **AI Builder → Pengaturan** (runtime, tanpa deploy ulang)

---

## 3. Alur per Kapabilitas

### 3.1 Materi Teks (AI Writer)
1. Isi topik, mapel, jenjang, panjang, gaya bahasa (instruksi & materi sumber opsional)
2. **Generate Materi** → draft muncul (judul, deskripsi, konten markdown-lite, poin kunci, tips) — semua bisa diedit
3. Pilih penempatan (kelas/mapel/Bab) → **Simpan sebagai Draft Materi**
4. Review di halaman Materi → publish

Shortcut: tombol **"Isi dengan AI"** di form Upload Materi (tipe Teks) mengisi form langsung.

### 3.2 Materi Gambar (AI Image)
1. Tulis prompt (atau pakai `imagePrompt` dari soal bergambar), pilih **gaya** (flat vector, diagram berlabel, kartun, whiteboard), **rasio**, jumlah
2. **Generate Gambar** → gallery hasil (tersimpan otomatis ke Media Manager)
3. Per gambar: **Salin URL** untuk dipakai di soal/materi lain, atau **Simpan ke Materi** (isi judul + penempatan Bab)
4. **Upgrade soal bergambar:** di preview AI Question Generator, tombol **"Generate gambar"** langsung membuat gambar dari `imagePrompt` soal dan meng-attach ke soal

### 3.3 Aset Visual CMS (Desain — khusus Admin)
1. Pilih **preset** (Hero/Slider Banner, Cover Program, Popup Promo, Section LP/CP, Cover Blog, Galeri) — ukuran & rasio otomatis
2. Tulis prompt (sebutkan warna brand & suasana) → **Generate Aset**
3. **"Pasang ke {target}"** — langsung membuat banner baru / update cover program / popup / cover blog / item galeri
4. Atau salin URL dan tempel manual di CMS

### 3.4 Materi Audio (TTS)
1. Tempel teks narasi (bisa dari hasil AI Writer — maks 4000 karakter), pilih voice & kecepatan
2. **Generate Audio** → preview player
3. Isi judul + penempatan → **Simpan sebagai Draft Materi Audio** (durasi otomatis tercatat)

### 3.5 Materi Video
Dua mode (toggle di form; default dari Pengaturan):
- **Composite (hemat):** naskah per scene AI → ilustrasi per scene → narasi TTS → FFmpeg merakit MP4 720p dengan **subtitle otomatis** + transisi fade. Berjalan background — progress per tahap dipantau di halaman yang sama.
- **Direct video-gen (premium):** satu prompt sinematik → model video (Veo 3.1 / Hailuo 3 / Wan 2.7) via OpenRouter. Kualitas tinggi, biaya jauh lebih mahal per video.

Guardrail: maks 12 scene, durasi ≤ 5 menit, satu job video aktif per user. Job gagal bisa di-**retry** dengan parameter sama.

### 3.6 Soal (AI Question Generator)
Tersedia di tab Soal AI Builder **dan** di halaman Bank Soal (integrasi mapel & ujian). Pilih tipe soal, difficulty, jumlah, jenjang, kurikulum, bahasa — hasil preview dulu, lalu simpan ke Bank Soal.

### 3.7 Paket Bab AI (puncak integrasi)
Satu form: **topik + mapel + jenjang + Bab** → sistem menjalankan berurutan:
1. Artikel materi (draft `TEXT`)
2. Gambar ilustrasi (draft `IMAGE`)
3. Narasi audio (draft `AUDIO`)
4. Latihan soal (ke Bank Soal)
5. Video (opsional, job background)

Semua materi masuk dalam satu **chapterTitle** → otomatis jadi rangkaian Bab sesuai `guide-pembuatan-bab.md`. Progress per bagian terlihat live; bagian yang gagal bisa di-**retry** sendiri. Hasil akhir: draft yang siap di-review dan dipublikasikan.

---

## 4. Uji Cepat End-to-End (Paket Bab AI)

1. Login sebagai guru → **AI Builder** → tab **Paket Bab**
2. Topik: `Fotosintesis — proses dan faktor yang memengaruhi`, pilih mapel & jenjang, Bab: `Bab 3: Fotosintesis`
3. Centang: Artikel + Gambar + Audio + Soal (5 soal) → **Buat Paket Bab**
4. Pantau progress per bagian → selesai → **Review di halaman Materi**
5. Di halaman Materi: pastikan 3 draft (TEXT/IMAGE/AUDIO) dengan Bab sama → atur urutan (`order`) → publish
6. (Opsional) Buat ujian dari soal yang baru masuk Bank Soal → lampirkan ke materi terakhir Bab → "Lanjut ke Latihan" muncul untuk siswa

---

## 5. Pengaturan (khusus Super Admin)

Tab Pengaturan di AI Builder — semua runtime, tanpa deploy ulang:
- **Provider per kapabilitas** (+ indikator key terkonfigurasi)
- **Budget AI bulanan** global + estimasi biaya per unit per kapabilitas
- **Kuota bulanan** matrix role × kapabilitas
- **Akses role** (modul + kapabilitas DESIGN khusus)
- **Label "Dibuat dengan AI"** di view siswa (toggle)
- **Mode video** default (composite/direct) & storage

Kunci API **tetap di environment variables** server — settings hanya memilih provider aktif.

---

## 6. FAQ

**Kenapa hasilnya draft, bukan langsung publish?** Moderasi konten — guru harus review kualitas & kesesuaian sebelum siswa melihat.

**Biaya siapa yang bayar?** API key milik institusi (di server). Kuota per role + budget global mencegah pembengkakan — pantau di tab Riwayat.

**Job video saya tidak jalan-jalan?** Pastikan 3 provider (teks/gambar/TTS) terkonfigurasi, cek tab Riwayat untuk error, gunakan tombol Retry.

**Bisa pakai hasil AI di tempat lain?** Ya — semua gambar/audio/video tersimpan di Media Manager (folder `ai-materials` / `ai-cms`), salin URL atau pilih dari media picker.
