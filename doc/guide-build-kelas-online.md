# Panduan Admin: Membuat Kelas Online / Belajar Online

Panduan lengkap untuk admin dalam membuat dan mengelola kelas online menggunakan fitur yang sudah tersedia di LMS Bimbel.

---

## Fitur yang Tersedia untuk Kelas Online

| Fitur | Status | Lokasi | Keterangan |
|-------|--------|--------|------------|
| **Tipe Kelas ONLINE** | ✅ Aktif | Admin → Manajemen Kelas | Pilih tipe "Online" saat membuat kelas |
| **Live Session (Kelas Live)** | ✅ Aktif | Guru → Kelas Online | Jadwalkan sesi video via Google Meet/Zoom/Teams |
| **Materi Pembelajaran** | ✅ Aktif | Guru → Materi | Upload PDF, video, PPT untuk siswa akses kapan saja |
| **Tugas & PR** | ✅ Aktif | Guru → Tugas | Berikan tugas, siswa kumpulkan online |
| **Ujian Online** | ✅ Aktif | Guru → Ujian | Buat ujian/kuis dengan timer otomatis |
| **Forum Diskusi** | ✅ Aktif | Guru/Siswa → Forum | Diskusi tanya jawab per kelas |
| **Chat Private** | ✅ Aktif | Guru/Siswa → Chat | Chat langsung guru-siswa |
| **Absensi** | ✅ Aktif | Guru → Absensi | Pencatatan kehadiran per pertemuan |
| **Jadwal Kelas** | ✅ Aktif | Admin → Kelas → Jadwal | Atur jadwal mingguan berulang |
| **Kalender Akademik** | ✅ Aktif | Admin → Kalender Akademik | Tanggal libur, ujian, event |
| **Pengumuman** | ✅ Aktif | Admin → Pengumuman | Broadcast info ke siswa/guru |
| **Nilai & Rapor** | ✅ Aktif | Guru → Nilai / Rapor | Input nilai, generate rapor PDF |

---

## Langkah 1: Pastikan Data Master Siap

Sebelum membuat kelas online, pastikan data berikut sudah ada:

### 1a. Mata Pelajaran
- Menu: **Admin → Master → Mata Pelajaran**
- Pastikan ada subject untuk kelas online (misal: "Matematika", "Fisika")
- Jika belum ada, minta admin/SUPER_ADMIN untuk menambahkan

### 1b. Guru Pengajar
- Menu: **Admin → Manajemen Pengguna**
- Pastikan ada user dengan role **GURU** yang aktif
- Guru ini akan mengelola materi, tugas, ujian, dan sesi live

### 1c. Cabang (jika multi-branch)
- Menu: **Admin → Master → Cabang**
- Untuk kelas online, bisa tetap diletakkan di cabang tertentu atau cabang utama

### 1d. Aktifkan Feature Flags (jika perlu)
- Menu: **Admin → Feature Flags**
- Pastikan flag berikut aktif:
  - `FEAT_CLASS_SCHEDULE` — Kelas & Jadwal
  - `FEAT_MATERIALS` — Materi Pembelajaran
  - `FEAT_ASSIGNMENTS` — Tugas & PR
  - `FEAT_ONLINE_EXAM` — Ujian Online
  - `FEAT_LIVE_CLASS` — Kelas Online Live (jika masih nonaktif, aktifkan)
  - `FEAT_FORUM` — Forum Diskusi
  - `FEAT_ATTENDANCE` — Absensi

---

## Langkah 2: Buat Kelas Baru (Tipe: Online)

1. Buka **Admin → Manajemen Kelas**
2. Klik tombol **"+ Buat Kelas"** (pojok kanan atas)
3. Isi form pembuatan kelas:

| Field | Isian | Keterangan |
|-------|-------|------------|
| **Nama Kelas** | Contoh: "Matematika Online — UTBK Persiapan" | Nama yang deskriptif |
| **Mata Pelajaran** | Pilih dari dropdown | Harus sudah ada di master |
| **Guru Pengajar** | Pilih dari dropdown | Guru yang akan mengajar |
| **Cabang** | Pilih cabang (untuk SUPER_ADMIN) | Cabang tempat kelas di-attach |
| **Tipe Kelas** | **Pilih "Online"** | ⚠️ Ini langkah penting |
| **Maks. Siswa** | Contoh: 50 | Untuk kelas online bisa lebih besar |
| **Ruangan** | Pilih "— Tanpa ruangan —" | Kelas online tidak butuh ruang fisik |
| **Tanggal Mulai** | Contoh: 2026-09-01 | Kapan kelas dimulai |
| **Tanggal Selesai** | Contoh: 2026-12-31 | Kapan kelas berakhir |
| **Deskripsi** | Contoh: "Kelas online persiapan UTBK..." | Info singkat untuk siswa |

4. Klik **"Buat Kelas"**
5. Anda akan diarahkan ke halaman detail kelas

---

## Langkah 3: Daftarkan Siswa ke Kelas

Di halaman detail kelas (`/admin/classes/[id]`):

1. Scroll ke bagian **"Daftar Siswa"** (panel kanan)
2. Pilih siswa dari dropdown
3. Klik **"Daftarkan"**
4. Ulangi untuk setiap siswa yang ingin didaftarkan

> **Tips:** Pastikan siswa sudah terdaftar di sistem (Admin → Manajemen Pengguna → role SISWA) sebelum bisa didaftarkan ke kelas.

---

## Langkah 4: Atur Jadwal Kelas

1. Di halaman detail kelas, klik **"Kelola Jadwal"** (panel kiri bawah)
2. Tambah jadwal pertemuan berulang:

| Field | Contoh | Keterangan |
|-------|--------|------------|
| **Hari** | Senin | Hari pertemuan rutin |
| **Jam Mulai** | 19:00 | Waktu mulai |
| **Jam Selesai** | 20:30 | Waktu selesai |
| **Ruangan** | — Tanpa ruangan — | Kelas online tidak butuh ruang |

3. Klik **"Tambah Jadwal"**
4. Tambah jadwal lain jika perlu (misal: Senin & Kamis)

> Jadwal ini akan muncul di kalender siswa dan guru.

---

## Langkah 5: Guru Menyiapkan Konten Online

Setelah kelas dibuat admin, **guru** login dan menyiapkan konten:

### 5a. Upload Materi Pembelajaran
- Menu: **Guru → Materi**
- Klik **"+ Tambah Materi"**
- Isi: judul, pilih kelas, deskripsi, upload file (PDF/Video/PPT)
- Klik **"Simpan"**
- Siswa bisa mengakses materi kapan saja di **Siswa → Materi**

### 5b. Buat Tugas / PR
- Menu: **Guru → Tugas**
- Klik **"+ Buat Tugas"**
- Isi: judul, pilih kelas, deskripsi, deadline (tanggal & jam)
- Siswa mengumpulkan jawaban online
- Guru bisa melihat submissions dan memberi nilai

### 5c. Buat Ujian Online
- Menu: **Guru → Ujian**
- Klik **"Buat Ujian"**
- Isi: judul, pilih kelas, durasi (menit), waktu mulai
- Tambah soal (pilihan ganda / essay)
- Publish ujian saat siap
- Siswa mengerjakan di **Siswa → Ujian** dengan timer otomatis

### 5d. Jadwalkan Sesi Live (Video Conference)
- Menu: **Guru → Kelas Online**
- Klik **"Jadwalkan Sesi"**
- Isi form:

| Field | Contoh | Keterangan |
|-------|--------|------------|
| **Kelas** | Pilih kelas online | Harus kelas yang diajar guru |
| **Judul Sesi** | "Pembahasan Soal UTBK #1" | Nama sesi |
| **Waktu Mulai** | 2026-09-01 19:00 | Tanggal & jam mulai |
| **Waktu Selesai** | 2026-09-01 20:30 | Tanggal & jam selesai |
| **Platform** | Google Meet / Zoom / dll | Pilih platform |
| **Link Meeting** | `https://meet.google.com/xxx` | Paste link meeting |
| **Deskripsi** | "Bawa soal latihan bab 1-3" | Info untuk siswa |

- Klik **"Jadwalkan"**
- Siswa melihat sesi di **Siswa → Kelas Online** dan bisa klik **"Masuk ke Kelas"** saat sesi dimulai
- Setelah sesi selesai, guru bisa menambahkan **link rekaman** untuk siswa yang terlewat

### 5e. Forum Diskusi
- Menu: **Guru → Forum** atau **Siswa → Forum**
- Guru/siswa bisa membuat thread diskusi per kelas
- Siswa bisa bertanya, guru menjawab
- Mendukung upvote dan mark as answer

---

## Langkah 6: Monitoring & Evaluasi

### Untuk Admin:
- **Admin → Analytics** — Lihat statistik kelas, siswa, guru
- **Admin → Manajemen Kelas → [Kelas]** — Cek jumlah siswa, materi, tugas
- **Admin → Audit Log** — Riwayat aktivitas (untuk SUPER_ADMIN)

### Untuk Guru:
- **Guru → Absensi** — Catat kehadiran siswa per pertemuan
- **Guru → Nilai** — Input nilai tugas/ujian
- **Guru → Rapor** — Generate rapor per periode
- **Guru → Jurnal Mengajar** — Catat apa yang diajar per pertemuan

### Untuk Siswa:
- **Siswa → Materi** — Akses materi kapan saja
- **Siswa → Tugas** — Lihat dan kumpulkan tugas
- **Siswa → Ujian** — Kerjakan ujian online
- **Siswa → Kelas Online** — Ikuti sesi live / tonton rekaman
- **Siswa → Jadwal** — Lihat jadwal kelas
- **Siswa → Nilai** — Lihat hasil nilai
- **Siswa → Forum** — Diskusi dengan guru & teman

---

## Checklist Cepat: Setup Kelas Online

- [ ] Mata pelajaran sudah ada di master
- [ ] Guru sudah terdaftar dan aktif
- [ ] Feature flags aktif (terutama FEAT_LIVE_CLASS, FEAT_MATERIALS, FEAT_ONLINE_EXAM)
- [ ] Buat kelas baru dengan tipe **ONLINE**
- [ ] Daftarkan siswa ke kelas
- [ ] Atur jadwal pertemuan
- [ ] Guru upload materi pertama
- [ ] Guru buat tugas pertama
- [ ] Guru jadwalkan sesi live (Google Meet/Zoom)
- [ ] Guru paste link meeting ke sesi live
- [ ] Tes: login sebagai siswa, cek materi/tugas/jadwal live
- [ ] Forum diskusi aktif untuk kelas

---

## Tips & Best Practices

### Link Meeting
- **Google Meet:** Gratis hingga 100 peserta, tidak perlu install
- **Zoom:** Lebih baik untuk kelas besar (500+ peserta), perlu akun berbayar
- **YouTube Live:** Untuk siaran satu arah (guru → siswa), gratis tanpa batas peserta
- Setelah sesi selesai, selalu tambahkan **link rekaman** agar siswa yang terlewat bisa menonton ulang

### Struktur Konten
- Upload materi **sebelum** sesi live agar siswa bisa persiapan
- Buat tugas dengan **deadline yang jelas** (tanggal + jam)
- Untuk ujian, set **waktu mulai** dan **durasi** dengan tepat
- Gunakan forum untuk pertanyaan di luar jam live

### Absensi Online
- Gunakan menu **Guru → Absensi** untuk mencatat kehadiran di sesi live
- Bisa juga aktifkan **Absensi QR Code** (feature flag `FEAT_ATTENDANCE_QR`) untuk check-in otomatis

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Siswa tidak melihat kelas online | Pastikan siswa sudah didaftarkan ke kelas (Admin → Kelas → Daftar Siswa) |
| Guru tidak melihat kelas di menu Live | Pastikan guru adalah pengajar kelas tersebut dan kelas aktif |
| Link meeting tidak muncul untuk siswa | Guru harus isi link meeting saat membuat/edit sesi live |
| Materi tidak muncul untuk siswa | Pastikan materi sudah di-publish dan siswa terdaftar di kelas |
| Siswa tidak bisa kerjakan ujian | Pastikan ujian sudah di-publish dan waktu mulai sudah tiba |
| Forum tidak ada thread | Buat thread pertama sebagai guru untuk memulai diskusi |

---

## Mekanisme Paket Kelas Online di Frontpage Publik

Selain pendaftaran manual oleh admin, sistem ini mendukung alur pendaftaran publik: calon siswa melihat paket kelas online di frontpage, mendaftar, membayar, dan otomatis/manual terdaftar sebagai siswa kelas tersebut.

### Komponen yang Tersedia

| Komponen | Lokasi | Fungsi |
|----------|--------|--------|
| **Landing Page Builder** | Admin → CMS → Landing Pages | Buat halaman publik custom untuk paket kelas online |
| **Program & Jenjang** | Admin → Master → Program | Definisikan program/paket (misal: "UTBK Online", "Matematika Online") |
| **Halaman Pendaftaran** | `/daftar` | Form pendaftaran siswa baru publik (support preselect program via URL param) |
| **Billing Plan** | Admin → Keuangan | Atur paket harga (per periode atau per jumlah pertemuan) |
| **Invoice & Payment** | Admin → Keuangan → Finance | Tagihan & konfirmasi pembayaran |
| **PPDB Online** | Admin → PPDB | Penerimaan siswa baru online dengan tracking status |
| **Site Program (CMS)** | Admin → CMS → Program | Tampilkan program di homepage publik |

### Alur Pendaftaran Paket Kelas Online

```
Calon Siswa ──> Landing Page Publik ──> Halaman Pendaftaran (/daftar?program=slug)
     │                                        │
     │                                        v
     │                                   Isi Form Pendaftaran
     │                                        │
     │                                        v
     │                                   Akun Siswa Dibuat (status: pending/aktif)
     │                                        │
     │                                        v
     │                                   Invoice Dibuat Otomatis (jika program berbayar)
     │                                        │
     │                                        v
     │                                   Pembayaran (Transfer/QRIS/Manual)
     │                                        │
     │                                        v
     │                                   Admin Konfirmasi Pembayaran
     │                                        │
     v                                        v
Siswa Login ──> Admin Daftarkan ke Kelas ──> Siswa Akses Kelas Online
```

### Langkah Setup Paket Kelas Online Publik

#### 1. Buat Program/Paket
- Menu: **Admin → Master → Program & Jenjang**
- Klik tambah program
- Isi: nama (misal: "UTBK Online Intensif"), slug (misal: `utbk-online`), deskripsi, harga
- Aktifkan program
- Hubungkan dengan cabang yang relevan

#### 2. Buat Landing Page Publik
- Menu: **Admin → CMS → Landing Pages** → **Buat Landing Page**
- Isi:
  - **Slug:** misal: `utbk-online-intensif` (URL: `/lp/utbk-online-intensif`)
  - **Title:** "UTBK Online Intensif — Persiapan Masuk PTN"
  - **Sections:** tambahkan hero, keunggulan program, jadwal, harga, testimoni
  - **CTA Type:** pilih `INQUIRY` (tombol "Daftar" arah ke form inquiry) atau `LINK` (arah ke URL custom)
  - **CTA URL:** set ke `/daftar?program=utbk-online` (agar preselect program saat siswa daftar)
- Publish landing page

#### 3. Tampilkan di Homepage
- Menu: **Admin → CMS → Program** — tambahkan program ke homepage
- Atau tambahkan menu navigasi: **Admin → CMS → Menu** → tambah link ke landing page
- Bisa juga tambahkan banner: **Admin → CMS → Banner** → link ke landing page

#### 4. Atur Paket Harga (Billing Plan)
- Menu: **Admin → Keuangan** → buat invoice manual, atau
- Setup billing plan berulang untuk program tersebut
- Tipe: `PERIOD` (per bulan/semester) atau `MEETING_PACKAGE` (per jumlah pertemuan)

#### 5. Calon Siswa Mendaftar
- Calon siswa mengakses landing page publik (misal: `digsan.study/lp/utbk-online-intensif`)
- Klik tombol CTA → diarahkan ke `/daftar?program=utbk-online`
- Form pendaftaran otomatis preselect program yang dipilih
- Siswa mengisi data diri, upload dokumen (jika PPDB aktif)
- Sistem membuat akun siswa + invoice (jika program berbayar)

#### 6. Konfirmasi Pembayaran & Aktivasi
- **Otomatis:** jika pembayaran online aktif (Midtrans/Xendit), invoice auto-paid
- **Manual:** admin cek pembayaran di **Admin → Keuangan** → konfirmasi pembayaran
- Setelah pembayaran dikonfirmasi, siswa aktif dan bisa login

#### 7. Daftarkan Siswa ke Kelas
- **Manual:** Admin → Manajemen Kelas → pilih kelas online → daftarkan siswa
- **Via PPDB:** jika PPDB aktif, admin bisa approve pendaftaran dan auto-assign ke kelas
- Siswa login → melihat kelas online di dashboard → akses materi, jadwal live, tugas, ujian

### Tips Landing Page untuk Paket Online

- **Hero section:** Judul jelas + manfaat utama + CTA "Daftar Sekarang"
- **Jadwal sesi live:** Tampilkan jadwal pertemuan agar calon siswa tahu kapan kelas dimulai
- **Harga transparan:** Tampilkan biaya dan paket yang tersedia
- **Testimoni:** Tampilkan testimoni siswa yang sudah berhasil
- **Video preview:** Embed video pengenalan kelas (CMS → Video)
- **FAQ:** Tambahkan FAQ umum tentang kelas online (Admin → FAQ)
