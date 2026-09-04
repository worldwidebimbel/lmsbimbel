# Guide: Uji End-to-End Pembuatan Bab (Video → Artikel → PPT → Latihan)

> Task: `8.5` Uji end-to-end — guru buat 1 Bab (Video → Artikel → PPT → Latihan) → siswa buka & selesaikan berurutan.
> Dokumen ini adalah panduan langkah-demi-langkah (test script) sekaligus referensi cara kerja fitur Bab.

---

## 1. Konsep Dasar: Bagaimana "Bab" Bekerja

**Bab BUKAN entitas terpisah** — ia adalah pengelompokan logis beberapa materi:

- Semua materi dengan **`Judul Bab` (chapterTitle) yang sama persis** DAN **kelas yang sama** otomatis menjadi satu rangkaian aktivitas berurutan.
- Urutan langkah dalam Bab ditentukan field **`Urutan` (order)** — kecil → besar (1, 2, 3, ...).
- Field **`Urutan Bab` (chapterOrder)** menentukan urutan Bab itu sendiri di daftar materi.
- Siswa membuka salah satu materi → sidebar kanan menampilkan **Rangkaian Aktivitas** (status DONE / CURRENT / TODO) + navigasi **Sebelumnya / Lanjut ke ...** di bawah konten.
- Label langkah otomatis dari tipe materi:

| Tipe Materi (pilihan guru) | Label langkah bagi siswa | Tampilan konten |
|---|---|---|
| `VIDEO` / `YOUTUBE` | Video Materi | Video player embed |
| `TEXT` (Teks / Artikel) | Artikel Materi | Artikel (markdown sederhana) |
| `PRESENTATION` (PPT) | Artikel Materi (PPT) | Slide viewer (nama file + indikator halaman + fullscreen) |
| `PDF` / `DOCUMENT` / `LINK` | Dokumen/Link Materi | Kartu + tombol "Buka Materi" |
| Ujian terlampir | judul ujian (EVALUATION) | Section "Quiz & Ujian" + tombol Kerjakan |

- **Poin Penting (keyPoints)** dari materi bertipe `TEXT` dalam Bab ditampilkan di sidebar "Materi Bab".
- Tombol **"Lanjut ke Latihan"** hanya muncul di materi terakhir Bab jika ada **ujian yang dilampirkan ke materi tersebut** (exam.materialId).

---

## 2. Prasyarat

- [ ] Akun **Guru** aktif (contoh demo: `guru@lmsbimbel.id` / `guru123`)
- [ ] Akun **Siswa** aktif yang terdaftar di kelas guru tsb (contoh demo: `siswa@lmsbimbel.id` / `siswa123`)
- [ ] Guru memiliki **min. 1 kelas aktif** (`/guru/kelas` — kelas dengan guru sebagai pengampu)
- [ ] Siswa **ter-enroll di kelas tersebut** (cek dari admin atau `/guru/kelas`)
- [ ] **Min. 1 mata pelajaran aktif** (`/admin/akademik` → Mapel)
- [ ] Siapkan aset: 1 link video YouTube (untuk langkah Video) dan 1 file `.pptx` (untuk langkah PPT)

> ⚠️ Semua materi dalam satu Bab **harus memilih kelas yang sama** (bukan campur "-- Semua Kelas --" dengan kelas tertentu) — pengelompokan sibling memakai `chapterTitle` + `classId`.

---

## 3. Bagian A — Guru Membuat 4 Materi dalam 1 Bab

Login sebagai guru → menu **Materi Pembelajaran** (`/guru/materi`) → klik tombol **+ Tambah Materi**. Isi form **4 kali** dengan nilai berikut:

### A1 — Langkah 1: Video

| Field | Nilai |
|---|---|
| Judul Materi * | `Bab 1 — Structure: Pengantar` |
| Tipe Materi | **YouTube Link** (atau Video File bila punya URL file video) |
| URL YouTube * | `https://youtube.com/watch?v=...` (video pembelajaran relevan) |
| Judul Bab | `Bab 1: Structure Basics` ⚠️ **samakan persis di 4 materi** |
| Urutan Bab | `1` |
| Ringkasan Materi | 1–2 kalimat ringkasan video |
| Poin Penting (satu per baris) | 3 baris poin kunci video |
| Tips Belajar | "Tonton sampai selesai, catat poin penting..." |
| Mata Pelajaran | pilih mapel kelas |
| Kelas | pilih kelas target (sama utk semua langkah) |
| Urutan (order) | `1` |
| Publikasikan | ON |

→ Klik **Tambah Materi**.

### A2 — Langkah 2: Artikel

| Field | Nilai |
|---|---|
| Judul Materi * | `Bab 1 — Structure: Materi Ringkas` |
| Tipe Materi | **Teks / Artikel** |
| Judul Bab | `Bab 1: Structure Basics` (persis sama) |
| Urutan Bab | `1` |
| Isi Artikel | Gunakan format: `# Judul`, `## Sub Judul`, `**tebal**`, `1. item`, tabel `\| Kolom \| Kolom \|` |
| Poin Penting (satu per baris) | ⚠️ **Wajib diisi** — inilah yang tampil di sidebar "Materi Bab" siswa |
| Tips Belajar | opsional |
| Mata Pelajaran / Kelas | sama seperti A1 |
| Urutan (order) | `2` |
| Publikasikan | ON |

### A3 — Langkah 3: PPT

| Field | Nilai |
|---|---|
| Judul Materi * | `Bab 1 — Structure: Slide Presentasi` |
| Tipe Materi | **Presentasi (PPT)** |
| File | **Pilih file** `.ppt/.pptx` (maks 50MB) → **Upload File** → tunggu "File berhasil diupload" |
| Jumlah Slide | isi sesuai file (mis. `18`) — dipakai indikator halaman slide viewer |
| Judul Bab | `Bab 1: Structure Basics` (persis sama) |
| Urutan Bab | `1` |
| Ringkasan Materi | ringkasan isi slide |
| Mata Pelajaran / Kelas | sama seperti A1 |
| Urutan (order) | `3` |
| Publikasikan | ON |

### A4 — Langkah 4: Latihan (Ujian terlampir)

Form "Buat Ujian" sudah mendukung field **Lampirkan ke Materi** (opsional) — gunakan agar ujian tampil sebagai langkah evaluasi di halaman Bab:

1. Menu **Ujian** (`/guru/ujian`) → **Buat Ujian**.
2. Judul: `Latihan Bab 1: Structure Basics` · Terkait dengan: **Kelas** (pilih kelas yang sama).
3. Field **Lampirkan ke Materi (opsional)** yang muncul setelah kelas dipilih → pilih **`Bab: Bab 1: Structure Basics — Bab 1 — Structure: Slide Presentasi`** (materi PPT, langkah terakhir Bab).
   - Daftar pilihan otomatis tersaring mengikuti kelas yang dipilih. Jika belum ada materi di kelas tsb, buat dulu 3 materi di Bagian A lalu kembali ke form ini.
4. Durasi: `10` · Nilai Lulus: `60` · Maks. Percobaan: `2`.
5. Klik **Buat & Tambah Soal** → tambah **min. 3 soal** (manual atau Ambil dari Bank Soal).
6. **Publikasikan ujian** dari halaman detail ujian (ujian harus published agar tampil bagi siswa).

> 💡 Ujian yang sudah dibuat tetap bisa dilampirkan/dilepas kapan saja: di halaman detail ujian (`/guru/ujian/{id}`) terdapat bar **"Lampiran ke Materi"** — pilih materi → **Simpan** (`PATCH /api/guru/ujian/[id]` mendukung `materialId`).

---

## 4. Bagian B — Verifikasi Sisi Guru

- [ ] `/guru/materi`: 3 materi tampil, badge **Judul Bab** sama di ketiganya, urutan Video(1) → Artikel(2) → PPT(3)
- [ ] Semua materi berstatus **publikasi ON**
- [ ] `/guru/ujian`: ujian Latihan Bab 1 tampil dengan soal ≥ 3 dan status publikasi ON

---

## 5. Bagian C — Siswa Membuka & Menyelesaikan Berurutan

Login sebagai siswa (tab/incognito terpisah).

### C1 — Listing materi

- [ ] `/siswa/materi`: 3 materi muncul di grup mata pelajaran, badge Judul Bab `Bab 1: Structure Basics`
- [ ] Klik materi **Video** (urutan pertama)

### C2 — Langkah 1: Video

- [ ] Breadcrumb: `Program Saya → {Kelas} → Bab 1: Structure Basics → Video Materi`
- [ ] Header: judul "Bab 1: Structure Basics", subtitle `1. Video Materi`
- [ ] Video tampil & dapat diputar; di bawahnya ringkasan + poin penting
- [ ] Sidebar **Rangkaian Aktivitas**: langkah 1 CURRENT (biru), langkah 2–3 TODO, ujian terlampir tampil sebagai langkah evaluasi
- [ ] Klik **Tandai Selesai** → tombol berubah jadi hijau "Selesai ✓" dan langkah 1 jadi DONE
- [ ] Klik **Lanjut ke Artikel Materi**

### C3 — Langkah 2: Artikel

- [ ] Subtitle `2. Artikel Materi`; artikel ter-render (heading, tebal, daftar)
- [ ] Sidebar "Materi Bab" menampilkan Poin Penting dari artikel ini
- [ ] **Tandai Selesai** → **Lanjut ke Artikel Materi (PPT)** (label dinamis sesuai tipe)

### C4 — Langkah 3: PPT

- [ ] Subtitle `3. Artikel Materi (PPT)`; slide viewer tampil: nama file, indikator halaman (x/y), navigasi prev/next, fullscreen; konten slide terbaca
- [ ] Section **Quiz & Ujian** menampilkan ujian Latihan Bab 1 (jumlah soal, durasi, KKM, sisa percobaan) dengan tombol **Kerjakan**
- [ ] **Tandai Selesai** → tombol navigasi berubah menjadi **"Lanjut ke Latihan"**

### C5 — Langkah 4: Latihan

- [ ] Klik **Lanjut ke Latihan** (atau tombol **Kerjakan**) → halaman ujian `/siswa/ujian/{id}`
- [ ] Kerjakan semua soal → submit → skor tampil (Lulus ≥ KKM 60)
- [ ] Kembali ke materi PPT: section Quiz & Ujian menampilkan **Skor terbaik** + status Lulus/Belum lulus; tombol jadi **Coba Lagi** (maks 2 percobaan)

### C6 — Verifikasi akhir

- [ ] `/siswa/materi`: counter kanan atas naik (`3/3 selesai` utk materi Bab ini) dan kartu materi bercentang
- [ ] Buka kembali salah satu materi: seluruh langkah di **Rangkaian Aktivitas** berstatus DONE (ujian tetap TODO — status ujian memakai percobaan, bukan progress materi)

---

## 6. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Materi tidak terkelompokkan / Rangkaian Aktivitas hanya 1 langkah | `Judul Bab` tidak sama persis (typo/spasi) ATAU pilihan Kelas berbeda antar materi | Edit materi, samakan `Judul Bab` + Kelas |
| Urutan langkah salah | field `Urutan` (order) salah | Set 1/2/3 sesuai urutan yang diinginkan |
| Materi tidak muncul bagi siswa | belum dipublikasikan, atau siswa tidak ter-enroll di kelas materi (materi "Semua Kelas" tampil untuk semua — tapi pengelompokan Bab tetap butuh kelas sama) | Publish materi / cek enroll siswa |
| "Lanjut ke Latihan" tidak muncul | ujian belum dilampirkan ke materi (`materialId` kosong) atau ujian belum published | Buka `/guru/ujian/{id}` → bar **Lampiran ke Materi** → pilih materi PPT → **Simpan**; pastikan ujian published |
| Quiz & Ujian kosong di halaman materi | ujian tidak published / lampiran ke materi lain | Publish ujian; pastikan lampiran = materi PPT (bar Lampiran ke Materi) |
| Ujian tak bisa dikerjakan | belum ada soal / window waktu belum mulai / percobaan habis | Tambah soal; cek Mulai/Selesai; naikkan Maks. Percobaan |
| PPT tidak tampil | file gagal upload (belum muncul "File berhasil diupload") | Upload ulang file (maks 50MB) sebelum simpan |

---

## 7. Catatan Gap UI

1. ~~Field "Lampirkan ke Materi" belum ada di form Buat Ujian~~ — **✅ FIXED**: form `/guru/ujian/new` kini punya dropdown **Lampirkan ke Materi** (tersaring per kelas terpilih), dan `PATCH /api/guru/ujian/[id]` mendukung `materialId` — ujian existing bisa dilampirkan/dilepas dari bar **Lampiran ke Materi** di halaman detail ujian.
2. **Status EVALUATION di Rangkaian Aktivitas selalu TODO** — tidak merefleksikan hasil pengerjaan ujian. Opsional: tandai DONE bila siswa sudah punya attempt lulus.
3. **Materi tanpa kelas ("Semua Kelas") + Bab** — pengelompokan sibling memakai `classId`; jika Bab di-set tanpa kelas, hanya materi tanpa kelas yang bergabung. Untuk Bab, selalu gunakan kelas spesifik.

---

*Dokumen dibuat untuk task `8.5` (timeline-4-minggu.md). Setelah uji selesai dan semua checklist hijau, tandai task sebagai done di timeline.*
