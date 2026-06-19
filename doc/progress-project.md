# Progress Project — EduBimbel LMS

**Last updated:** 2026-06-19  
**Commit:** `ea81e0f` — fix: QRIS upload settings, 5 tipe soal baru, fullstack question models  
**Build status:** ✅ Clean (90+ routes)  
**Live:** https://lmsbimbel.digsan.id  

**Scope baru:** Kebutuhan aplikasi berbasis web umum (company profile + LMS + ujian + event berbayar + sertifikat + administrasi multi-cabang + pembayaran otomatis).

---

## 🔧 Core Architecture

- [x] Next.js 15 App Router + TypeScript
- [x] Tailwind CSS + shadcn/ui setup
- [x] Prisma schema (semua model lengkap)
- [x] PostgreSQL database connection
- [x] NextAuth v5 (Credentials + Google OAuth)
- [x] JWT session dengan role & id
- [x] Middleware route protection (RBAC)
- [x] Feature flag system (cache + toggle API)
- [x] FeatureFlagContext + useFeature hook
- [x] Global layout (font, provider, toaster)
- [x] Root redirect by role
- [x] CI/CD GitHub Actions → VPS
- [x] `.env.example` & `README.md`
- [x] `deploy-server.md` (panduan VPS IDCloudHost)
- [x] Setup PostgreSQL di VPS production
- [x] Prisma db push di VPS
- [x] Nginx reverse proxy + SSL (Certbot) live di domain
- [x] CI/CD auto-deploy via GitHub Actions
- [x] Halaman pengaturan sistem — `/admin/settings` (Umum, Pembayaran/QRIS, Demo Data, Email, Info Sistem)
- [x] Import & clear demo data 4 tipe bimbel (Akademik, UTBK/SNBT, Kedinasan, Bahasa) — `src/lib/demo-seeder.ts`
- [ ] Branding global: tema warna navy / kuning / putih + CMS landing page

---

## 📋 Daftar Fitur per Modul

### 🏫 Modul 1: Manajemen Pengguna
- [x] Registrasi & Login (Email/Google) — NextAuth credentials + Google
- [x] Sistem peran & hak akses multi-role (SUPER_ADMIN, ADMIN, TUTOR/GURU, SISWA, ORANG_TUA) — middleware + role layouts
- [x] Halaman daftar pengguna (admin) — `/admin/users`
- [x] Form tambah pengguna — `/admin/users/new`
- [x] Form edit + suspend pengguna — `/admin/users/[id]`
- [x] API CRUD pengguna (`POST /api/admin/users`, `GET/PATCH/DELETE /api/admin/users/[id]`)
- [x] Manajemen profil pengguna (edit nama, HP, alamat, ganti password) — `/profile`
- [ ] Reset password via email
- [ ] Import data siswa (CSV/Excel)
- [ ] Kartu Siswa Digital (PDF)

### 📅 Modul 2: Kelas & Jadwal
- [x] Halaman daftar kelas (admin) — `/admin/classes`
- [x] Form buat kelas — `/admin/classes/new`
- [x] Detail kelas + enroll/keluarkan siswa — `/admin/classes/[id]`
- [x] API CRUD kelas + enroll siswa
- [x] Kelola jadwal per kelas (tambah/hapus) — `/admin/classes/[id]/schedules`
- [x] Siswa: jadwal mingguan visual per hari — `/siswa/jadwal`
- [x] Guru: overview kelas diampu + jadwal — `/guru/kelas`
- [ ] Kalender akademik

### 📖 Modul 3: Materi Pembelajaran
- [x] API CRUD materi (`GET/POST /api/materi`, `GET/PATCH/DELETE /api/materi/[id]`)
- [x] API progress siswa (`POST /api/materi/[id]/progress`)
- [x] Guru: halaman daftar & upload materi — `/guru/materi`
- [x] Guru: `MaterialList` component (search, filter, toggle publish, edit, delete)
- [x] Guru: `MaterialUploadModal` (semua tipe: PDF, Video, YouTube, Audio/Google Drive, Link, Teks, Gambar)
- [x] Siswa: halaman lihat materi per mata pelajaran — `/siswa/materi`
- [x] Siswa: `MaterialCard` (buka link, tandai selesai, progress tracking)
- [x] Upload file langsung ke cloud storage — `src/lib/cloudinary.ts`, `POST /api/upload` (Cloudinary, perlu set env vars)
- [ ] Rich text editor untuk konten teks
- [ ] Notifikasi materi baru ke siswa

### ✏️ Modul 4: Tugas & Pekerjaan Rumah
- [x] API CRUD tugas (`GET/POST /api/tugas`, `GET/PATCH/DELETE /api/tugas/[id]`)
- [x] API submit siswa (`POST /api/tugas/[id]/submit`)
- [x] API penilaian guru (`PATCH /api/tugas/[id]/submissions/[subId]`)
- [x] Guru: daftar tugas + modal buat/edit — `/guru/tugas`
- [x] Guru: halaman submissions + beri nilai/feedback — `/guru/tugas/[id]`
- [x] Siswa: daftar tugas (tab belum/selesai) + modal kumpulkan — `/siswa/tugas`
- [ ] Notifikasi deadline tugas
- [x] Upload file langsung (Cloudinary) — API `/api/upload` siap, perlu integrasi ke form

### 📝 Modul 5: Ujian & Kuis Online
- [x] Guru: daftar ujian — `/guru/ujian`
- [x] Guru: buat ujian (judul, durasi, KKM, jadwal, acak soal) — `/guru/ujian/new`
- [x] Guru: kelola soal (7 tipe: pilgan tunggal, pilgan kompleks, benar/salah, menjodohkan, mengurutkan, setuju/tidak, essay) + lihat hasil — `/guru/ujian/[id]`
- [x] Guru: publish/unpublish ujian
- [x] Siswa: daftar ujian tersedia — `/siswa/ujian`
- [x] Siswa: kerjakan ujian dengan timer countdown — `/siswa/ujian/[id]`
- [x] Auto-koreksi semua tipe soal (exact / partial credit) + skor otomatis
- [x] API: CRUD ujian, soal, submit jawaban
- [x] Bank soal bersama — `/guru/bank-soal` (tambah, hapus, import ke ujian)
- [ ] Pembahasan soal setelah ujian (review jawaban + kunci)
- [ ] Rapor / laporan hasil ujian per siswa dengan score & pembahasan
- [ ] Tryout / simulasi UTBK / Nasional

### 📊 Modul 6: Absensi
- [x] API sesi absensi (`GET/POST /api/absensi`, `GET/DELETE /api/absensi/[id]`)
- [x] API input rekap (`POST /api/absensi/[id]/records`)
- [x] Guru: daftar sesi + buat sesi + input per siswa (HADIR/SAKIT/IZIN/ALPHA) — `/guru/absensi`
- [x] Siswa: rekap kehadiran + persentase + tabel riwayat — `/siswa/absensi`
- [x] Absensi QR Code — guru tampilkan QR `/guru/absensi/[id]/qr`, siswa scan `/siswa/absensi/scan`
- [ ] Notifikasi ketidakhadiran ke orang tua
- [ ] Laporan absensi bulanan (PDF)

### 🏆 Modul 7: Nilai & Rapor
- [x] API komponen nilai (`GET/POST /api/nilai/components`, `DELETE /api/nilai/components/[id]`)
- [x] API input/rekap nilai (`GET/POST /api/nilai`)
- [x] Guru: tabel input nilai per siswa + komponen bobot + ranking — `/guru/nilai`
- [x] Siswa: rekap nilai per kelas + nilai akhir + progress bar — `/siswa/nilai`
- [ ] Rapor digital (cetak PDF)
- [x] Grafik perkembangan nilai (komponen, ujian, tugas) — `/siswa/nilai/grafik`
- [ ] Export Excel

### 📈 Modul 8: Analitik & Laporan
- [x] Dashboard admin (stats: siswa, guru, kelas, tagihan, feature flags) — `/admin`
- [x] Halaman analitik lengkap (KPI, absensi, nilai, keuangan, tabel kelas) — `/admin/analytics`
- [x] Progress belajar per siswa (statistik materi, tugas, ujian, nilai, kehadiran + grafik) — `/siswa/progress`
- [x] Statistik kehadiran & nilai per kelas (admin) — `/admin/analytics/classes`
- [x] Laporan kinerja guru (kelas, materi, tugas, ujian, absensi, penilaian) — `/admin/analytics/teachers`
- [ ] Analitik soal (tingkat kesulitan, daya pembeda)
- [ ] Export laporan (PDF/Excel)

### 💰 Modul 9: Keuangan, Pembayaran & Administrasi Multi-Cabang
- [x] Halaman daftar tagihan (admin) — `/admin/finance`
- [x] Summary keuangan (total terbayar, belum bayar, jatuh tempo)
- [x] Form buat tagihan manual — `/admin/finance/new`
- [x] Detail tagihan + konfirmasi pembayaran — `/admin/finance/[id]`
- [x] API tagihan (POST, GET/PATCH, konfirmasi) — `/api/admin/finance/invoices`
- [x] Halaman tagihan siswa — `/siswa/tagihan`
- [x] Pembayaran QRIS manual — tampil QR untuk discan siswa, upload bukti — `/siswa/tagihan`
- [x] Konfirmasi / tolak bukti bayar QRIS oleh admin — `/admin/finance/[id]` (approve + reject + lihat bukti)
- [x] Reminder tagihan otomatis (email) — `POST /api/admin/finance/reminder`
- [x] Histori transaksi + status PENDING — tabel di `/admin/finance`
- [x] Laporan keuangan bulanan (rekap 6 bulan, per metode, per status) — `/admin/finance/laporan`
- [x] Multi-cabang / multi-branch: model `Branch`, filter tagihan/kelas/user per cabang, pembuatan cabang, feature flag `FEAT_MULTI_BRANCH`
- [ ] Pencatatan pengeluaran operasional & gaji karyawan
- [ ] Rekap keuangan harian, mingguan, bulanan, tahunan
- [ ] Reminder jatuh tempo via WhatsApp (gateway WABLAS / Twilio / Fonnte)
- [ ] Daftar tunggakan + notifikasi waktu bayar
- [ ] Tagihan paketan meeting (contoh: per 10 pertemuan)
- [ ] Generate kuitansi / invoice PDF setelah pembayaran lunas
- [ ] Pembayaran online otomatis Midtrans / Xendit (toggle enable/disable per event/tagihan)
- [ ] Verifikasi pembayaran otomatis (Midtrans callback) + fallback manual upload bukti

### 🔔 Modul 10: Notifikasi & Pengumuman
- [x] Notifikasi in-app — `GET /api/notifications`
- [x] Tandai dibaca (satu/semua) — `POST /api/notifications/read`
- [x] Bell icon header real-time (polling 60s) — `NotificationBell.tsx`
- [x] Halaman notifikasi — `/notifikasi`
- [x] Broadcast pengumuman admin — `/admin/announcements`
- [x] API broadcast — `POST /api/admin/announcements`
- [ ] Notifikasi WhatsApp (via API)
- [x] Notifikasi email (SMTP nodemailer, broadcast pengumuman + tagihan + absensi) — `src/lib/email.ts`
- [ ] Notifikasi push (PWA)

### 💬 Modul 11: Forum Diskusi & Chat
- [x] Forum diskusi per kelas — `/siswa/forum`, `/guru/forum`
- [x] Thread tanya jawab siswa-guru (buat, baca, hapus)
- [x] Upvote thread & jawaban
- [x] Chat private siswa-guru — `/siswa/chat`, `/guru/chat`, polling 5s, unread badge — `ChatInterface.tsx`
- [ ] Group chat per kelas

### 🎥 Modul 12: Kelas Online (Live)
- [x] Integrasi Zoom / Google Meet / Teams / YouTube Live — simpan & tampilkan link meeting
- [x] Jadwal kelas online (buat, edit, hapus) — `/guru/live`, `/siswa/live`
- [x] Rekaman kelas tersimpan — field `recordingUrl`, tampil tombol tonton setelah sesi selesai
- [ ] Whiteboard digital
- [ ] Raise hand & polling

### 🎖️ Modul 13: Gamifikasi, Motivasi & E-Sertifikat
- [x] Poin & badge prestasi (computed dari aktivitas, persist ke DB) — `/siswa/prestasi`
- [x] Leaderboard siswa (rank per kelas berdasarkan poin)
- [x] Level & XP system (5 level: Pemula → Master)
- [ ] Streak belajar harian
- [ ] E-sertifikat otomatis (PDF) untuk lomba & siswa yang menyelesaikan LMS
- [ ] Template sertifikat yang bisa diganti-ganti (editor/admin)

### 👨‍👩‍👧 Modul 14: Portal Orang Tua
- [x] Dashboard orang tua — `/orangtua`
- [x] Lihat nilai anak (terbaru)
- [x] Lihat absensi anak
- [x] Lihat tagihan anak (unpaid)
- [x] Progress anak lengkap (nilai, tugas, ujian, absensi, kelas) — `/orangtua/progress`
- [x] Tagihan anak lengkap + riwayat + progress bayar — `/orangtua/tagihan`
- [x] Hubungkan akun anak (admin assign + self-service) — `/orangtua/link-anak`
- [ ] Chat dengan guru
- [ ] Bayar tagihan online

### 📱 Modul 15: PWA & Offline
- [x] Installable sebagai app (PWA) — `public/manifest.json` + meta tags + SW registration
- [x] Akses materi offline (cached) — `public/sw.js` cache-first strategy
- [ ] Sinkronisasi otomatis saat online

### 🌐 Modul 16: Landing Page & Marketing Website
- [x] Halaman publik depan (company profile)
- [x] Hero section dengan headline & CTA
- [x] SEO meta & Open Graph configuration
- [x] Navigasi publik (home, program, tentang, kontak, daftar)
- [x] Statistik real-time dari DB (siswa, guru, kelas, mapel)
- [x] Program unggulan (SD, SMP, SMA)
- [x] Features & keunggulan
- [x] Testimonial section
- [x] CTA section + WhatsApp link
- [x] Footer dengan kontak & links
- [x] Tema dasar Tailwind (bisa di-override)
- [ ] Branding: tone warna logo — Biru Navy, Kuning, Putih + warna minor harmonis
- [ ] Hero / Banner slider configurable
- [ ] Gallery prestasi siswa (foto, keterangan, periode)
- [ ] Gallery aktivitas bimbel (event, lomba, outing, kelas)
- [ ] Promo product per program: Kelas Reguler Offline & Kelas Online (LMS)
- [ ] Promo event-event tertentu: lomba olimpiade, tryout, open house
- [ ] Modal/popup promosi & CTA
- [ ] Form pendaftaran siswa baru / inquiry (lead CRM)
- [ ] Blog / artikel pemasaran
- [ ] CMS admin untuk kelola konten web frontpage, banner, promo, gallery, testimoni

### 🎟️ Modul 17: Event Berbayar Online
- [ ] Manajemen event (tryout online, lomba olimpiade, workshop) — admin CRUD
- [ ] Halaman publik daftar event / landing page event
- [ ] Registrasi peserta + pilih paket / tier harga
- [ ] Pembayaran event (Midtrans otomatis / QRIS manual / upload bukti)
- [ ] Pembayaran bisa toggle enable/disable (gratis vs berbayar)
- [ ] Sesi ujian khusus event (soal terpisah dari kelas regular)
- [ ] Hasil & ranking event (leaderboard, score, sertifikat)
- [ ] E-sertifikat otomatis untuk peserta lomba
- [ ] Notifikasi reminder event via email/WhatsApp

---

## 🏢 Multi-Cabang: Tugas Tersisa (Audit & Implementasi)

### Auth & Core
- [x] `defaultBranchId` di session/JWT
- [x] Helper `getBranchScope()` untuk filter role-based
- [ ] Enforce branch scope di semua server action & API non-admin

### Modul 1: Pengguna
- [x] Filter daftar user per cabang di `/admin/users`
- [x] User create/edit: assign `defaultBranchId` (admin) + branch selector for super admin
- [x] Non-super admin hanya bisa edit user di cabangnya sendiri
- [ ] Parent-child linking scoped by branch

### Modul 2: Kelas & Jadwal
- [x] Filter daftar kelas per cabang di `/admin/classes`
- [x] Create class dengan branch selector
- [ ] Edit class: update branch + branch selector
- [ ] Detail class: cek akses cabang, jadwal scoped by class branch

### Modul 3: Materi
- [ ] Filter materi per cabang (via class branch)
- [ ] Guru hanya lihat materi kelas di cabangnya

### Modul 4: Tugas
- [ ] Filter tugas per cabang (via class branch)
- [ ] Guru hanya buat tugas untuk kelas di cabangnya

### Modul 5: Ujian
- [ ] Filter ujian per cabang (via class branch)
- [ ] Bank soal scoped by branch

### Modul 6: Absensi
- [ ] Filter sesi absensi per cabang (via class branch)
- [ ] QR scan validasi cabang siswa

### Modul 7: Nilai & Rapor
- [ ] Filter nilai/rapor per cabang (via class branch)
- [ ] Grafik nilai per cabang

### Modul 8: Analitik
- [ ] Dashboard analitik filter by branch
- [ ] Laporan per cabang

### Modul 9: Keuangan
- [x] Filter tagihan per cabang
- [x] Create invoice dengan branch selector
- [ ] Detail tagihan: cek akses cabang
- [ ] Laporan keuangan per cabang
- [ ] Branch transaction (income/expense) CRUD
- [ ] Branch cash transfer antar cabang
- [ ] Settings QRIS per cabang

### Modul 10: Notifikasi & Pengumuman
- [ ] Broadcast pengumuman target by branch
- [ ] Notifikasi tagihan per cabang

### Modul 11: Forum & Chat
- [ ] Chat siswa-guru hanya dalam cabang yang sama
- [ ] Forum thread scoped by class branch

### Modul 12: Kelas Online
- [ ] Live session scoped by class branch
- [ ] Siswa hanya lihat live di cabangnya

### Modul 13: Gamifikasi
- [ ] Leaderboard per cabang (toggle)

### Modul 14: Portal Orang Tua
- [ ] Ortu hanya lihat data anak di cabang terkait

### Modul 17: Event Berbayar
- [ ] Event scoped by branch

---

## 📊 Summary Progress

| Modul | Selesai | Total | % |
|-------|---------|-------|---|
| Core Architecture | 15 | 19 | 79% |
| Modul 1: Pengguna | 7 | 9 | 78% |
| Modul 2: Kelas & Jadwal | 7 | 8 | 88% |
| Modul 3: Materi | 8 | 10 | 80% |
| Modul 4: Tugas | 7 | 8 | 88% |
| Modul 5: Ujian | 9 | 12 | 75% |
| Modul 6: Absensi | 5 | 7 | 71% |
| Modul 7: Nilai & Rapor | 5 | 7 | 71% |
| Modul 8: Analitik | 5 | 6 | 83% |
| Modul 9: Keuangan & Admin | 11 | 20 | 55% |
| Modul 10: Notifikasi | 7 | 9 | 78% |
| Modul 11: Forum & Chat | 4 | 5 | 80% |
| Modul 12: Kelas Online | 3 | 5 | 60% |
| Modul 13: Gamifikasi & Sertifikat | 3 | 5 | 60% |
| Modul 14: Portal Ortu | 7 | 8 | 88% |
| Modul 15: PWA | 2 | 3 | 67% |
| Modul 16: Landing Page | 10 | 22 | 45% |
| Modul 17: Event Berbayar | 0 | 9 | 0% |
| **TOTAL** | **116** | **182** | **64%** |

---

## 📝 Changelog

### 2026-06-19 — Multi-Cabang (progress update)
- **Modul 9:** implementasi dasar multi-cabang
  - Schema: model `Branch`, relasi `branchId` di `User`, `Class`, `Invoice`
  - Auth: `defaultBranchId` di JWT/session
  - API: CRUD cabang (`/api/admin/branches`), filter branch di `/api/admin/classes`, `/api/admin/finance/invoices`
  - UI: halaman cabang (`/admin/branches`), form tambah cabang, selector cabang di finance/users/classes/new invoice/new class
  - Feature flag: `FEAT_MULTI_BRANCH` di seed
  - Migration script: `scripts/seed-default-branch.ts` + `npm run db:seed:default-branch`
- **Build:** ✅ clean

### 2026-06-19 — Commit `ea81e0f`
- **Scope & Progress:** sinkronisasi kebutuhan baru ke `progress-project.md`
  - Modul 16: company profile (gallery, promo program, event olimpiade, navy/yellow/white branding)
  - Modul 5: 7 tipe soal (pilgan tunggal/kompleks, benar/salah, menjodohkan, mengurutkan, setuju/tidak, essay)
  - Modul 9: administrasi multi-cabang, pengeluaran, gaji, rekap harian/mingguan/bulanan/tahunan, kuitansi, Midtrans toggle
  - Modul 13: e-sertifikat otomatis dengan template
  - Modul 17: **Event Berbayar Online** (tryout, lomba olimpiade) — modul baru
- **Fix:** QRIS upload settings — key QRIS masuk ke `DEFAULT_SETTINGS`, auto-save setelah upload
- **Build:** ✅ clean

### 2026-06-19 — Commit `cd34aa9`
- **Modul 9:** QRIS payment flow — upload bukti, status PENDING, approve/reject admin, reminder email, laporan keuangan
- **Admin Settings:** Tab Pembayaran — upload gambar QRIS, nama bank, nama pemilik
- Schema: `PENDING` ke `InvoiceStatus`, `QRIS` ke `PaymentMethod`

### 2026-06-19 — Commit `0d565e6`
- **Modul 11:** Chat private siswa-guru — `/siswa/chat`, `/guru/chat`, polling 5s, unread badge
- **Modul 12:** Kelas Online — `/guru/live` (buat/edit/hapus sesi), `/siswa/live` (jadwal + join link + rekaman)
- **Cloudinary:** `src/lib/cloudinary.ts` + `POST /api/upload` — upload siap pakai setelah set env vars
- **Admin Settings:** `/admin/settings` — tab Umum, Demo Data, Email, Info Sistem
- **Demo Data:** Import 4 tipe bimbel + tombol clear, seeder `src/lib/demo-seeder.ts`

### 2026-06-19 — Commit `ab87b30`
- **Modul 11:** Forum diskusi per kelas (`ForumThread`, `ForumReply`, `ForumUpvote`) — `/siswa/forum`, `/guru/forum`
- **Modul 13:** Gamifikasi — poin, badge, level, leaderboard — `/siswa/prestasi`
- **Modul 15:** PWA — `manifest.json`, `sw.js`, meta tags
- Fix: `nodemailer` downgrade v7 (next-auth peer dep), `prisma generate`

### 2025-06-16 — Commit `b8fdfdc`
- Setup full project structure (Next.js 15, Prisma, NextAuth v5)
- Core: auth, feature flags, middleware, layouts
- Dashboards: Admin, Guru, Siswa, Orang Tua
- Admin pages: users, classes, finance, features control panel
- API: feature toggle PATCH, features GET
- Deploy: CI/CD GitHub Actions, panduan VPS IDCloudHost
