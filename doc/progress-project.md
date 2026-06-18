# Progress Project — EduBimbel LMS

**Last updated:** 2026-06-19  
**Commit:** `cd34aa9` — feat: Modul 9 QRIS payment, upload bukti, approve/reject, reminder, laporan  
**Build status:** ✅ Clean (90+ routes)  
**Live:** https://lmsbimbel.digsan.id _(belum deploy ke VPS)_

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
- [x] Halaman pengaturan sistem — `/admin/settings` (Umum, Demo Data, Email, Info Sistem)
- [x] Import & clear demo data 4 tipe bimbel (Akademik, UTBK/SNBT, Kedinasan, Bahasa) — `src/lib/demo-seeder.ts`

---

## 📋 Daftar Fitur per Modul

### 🏫 Modul 1: Manajemen Pengguna
- [x] Registrasi & Login (Email/Google) — NextAuth credentials + Google
- [x] Sistem peran & hak akses (RBAC) — middleware + role layouts
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
- [x] Guru: `MaterialUploadModal` (semua tipe: PDF, Video, YouTube, Link, Teks)
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
- [x] Guru: kelola soal (pilgan/esai/benar-salah) + lihat hasil — `/guru/ujian/[id]`
- [x] Guru: publish/unpublish ujian
- [x] Siswa: daftar ujian tersedia — `/siswa/ujian`
- [x] Siswa: kerjakan ujian dengan timer countdown — `/siswa/ujian/[id]`
- [x] Auto-koreksi pilgan + skor otomatis
- [x] API: CRUD ujian, soal, submit jawaban
- [x] Bank soal bersama — `/guru/bank-soal` (tambah, hapus, import ke ujian)
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

### 💰 Modul 9: Keuangan & Pembayaran
- [x] Halaman daftar tagihan (admin) — `/admin/finance`
- [x] Summary keuangan (total terbayar, belum bayar, jatuh tempo)
- [x] Form buat tagihan manual — `/admin/finance/new`
- [x] Detail tagihan + konfirmasi pembayaran — `/admin/finance/[id]`
- [x] API tagihan (POST, GET/PATCH, konfirmasi) — `/api/admin/finance/invoices`
- [x] Halaman tagihan siswa — `/siswa/tagihan`
- [ ] Pembayaran online (Midtrans/Xendit) — integrasi gateway
- [x] Pembayaran QRIS manual — tampil QR untuk discan siswa, upload bukti — `/siswa/tagihan`
- [x] Konfirmasi / tolak bukti bayar QRIS oleh admin — `/admin/finance/[id]` (approve + reject + lihat bukti)
- [x] Reminder tagihan otomatis (email) — `POST /api/admin/finance/reminder`
- [x] Histori transaksi + status PENDING — tabel di `/admin/finance`
- [x] Laporan keuangan bulanan (rekap 6 bulan, per metode, per status) — `/admin/finance/laporan`

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

### 🎖️ Modul 13: Gamifikasi & Motivasi
- [x] Poin & badge prestasi (computed dari aktivitas, persist ke DB) — `/siswa/prestasi`
- [x] Leaderboard siswa (rank per kelas berdasarkan poin)
- [ ] Streak belajar harian
- [ ] Sertifikat digital (PDF)
- [x] Level & XP system (5 level: Pemula → Master)

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
- [x] Halaman publik depan (company profile) — `/`
- [x] Hero section dengan headline & CTA
- [x] SEO meta & Open Graph configuration
- [x] Navigasi publik (home, program, tentang, kontak, daftar)
- [x] Statistik real-time dari DB (siswa, guru, kelas, mapel)
- [x] Program unggulan (SD, SMP, SMA)
- [x] Features & keunggulan
- [x] Testimonial section
- [x] CTA section + WhatsApp link
- [x] Footer dengan kontak & links
- [ ] Hero / Banner slider configurable
- [ ] Branding: logo, warna primer/sekunder/accent, font, heading (CMS)
- [ ] Modal/popup promosi & CTA
- [ ] Form pendaftaran siswa baru / inquiry
- [ ] Blog / artikel pemasaran
- [ ] CMS admin untuk kelola konten landing page

---

## 📊 Summary Progress

| Modul | Selesai | Total | % |
|-------|---------|-------|---|
| Core Architecture | 15 | 18 | 83% |
| Modul 1: Pengguna | 7 | 9 | 78% |
| Modul 2: Kelas & Jadwal | 7 | 8 | 88% |
| Modul 3: Materi | 8 | 10 | 80% |
| Modul 4: Tugas | 7 | 8 | 88% |
| Modul 5: Ujian | 9 | 9 | 100% |
| Modul 6: Absensi | 5 | 7 | 71% |
| Modul 7: Nilai & Rapor | 5 | 7 | 71% |
| Modul 8: Analitik | 5 | 6 | 83% |
| Modul 9: Keuangan | 10 | 11 | 91% |
| Modul 10: Notifikasi | 7 | 9 | 78% |
| Modul 11: Forum & Chat | 4 | 5 | 80% |
| Modul 12: Kelas Online | 3 | 5 | 60% |
| Modul 13: Gamifikasi | 3 | 5 | 60% |
| Modul 14: Portal Ortu | 7 | 8 | 88% |
| Modul 15: PWA | 2 | 3 | 67% |
| Modul 16: Landing Page | 9 | 16 | 56% |
| **TOTAL** | **93** | **136** | **68%** |

---

## 📝 Changelog

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
