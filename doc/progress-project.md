# Progress Project — EduBimbel LMS

**Last updated:** 2026-06-16  
**Commit:** `(latest)` — feat: tugas & PR module  
**Build status:** ✅ Clean (26 routes)  
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
- [ ] Setup PostgreSQL di VPS production
- [ ] Prisma db push + seed di VPS
- [ ] Nginx + SSL live di domain

---

## 📋 Daftar Fitur per Modul

### 🏫 Modul 1: Manajemen Pengguna
- [x] Registrasi & Login (Email/Google) — NextAuth credentials + Google
- [x] Sistem peran & hak akses (RBAC) — middleware + role layouts
- [x] Halaman daftar pengguna (admin) — `/admin/users`
- [ ] Form tambah / edit pengguna
- [ ] Manajemen profil pengguna (halaman edit)
- [ ] Verifikasi email
- [ ] Reset password
- [ ] Import data siswa (CSV/Excel)
- [ ] Kartu Siswa Digital (PDF)

### 📅 Modul 2: Kelas & Jadwal
- [x] Halaman daftar kelas (admin) — `/admin/classes`
- [ ] Form buat kelas baru
- [ ] Edit & nonaktifkan kelas
- [ ] Jadwal pertemuan (mingguan/insidental)
- [ ] Kalender akademik
- [ ] Manajemen ruang/kelas fisik
- [ ] Reschedule & pembatalan kelas
- [ ] Notifikasi jadwal otomatis

### 📖 Modul 3: Materi Pembelajaran
- [x] API CRUD materi (`GET/POST /api/materi`, `GET/PATCH/DELETE /api/materi/[id]`)
- [x] API progress siswa (`POST /api/materi/[id]/progress`)
- [x] Guru: halaman daftar & upload materi — `/guru/materi`
- [x] Guru: `MaterialList` component (search, filter, toggle publish, edit, delete)
- [x] Guru: `MaterialUploadModal` (semua tipe: PDF, Video, YouTube, Link, Teks)
- [x] Siswa: halaman lihat materi per mata pelajaran — `/siswa/materi`
- [x] Siswa: `MaterialCard` (buka link, tandai selesai, progress tracking)
- [ ] Upload file langsung ke cloud storage (Cloudinary/S3)
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
- [ ] Upload file langsung (Cloudinary/S3)

### 📝 Modul 5: Ujian & Kuis Online
- [ ] Bank soal (pilgan, essay, benar/salah, isian)
- [ ] Buat ujian dari bank soal (manual/acak)
- [ ] Timer ujian
- [ ] Anti-cheating (fullscreen mode, randomize soal)
- [ ] Auto-grading (pilgan)
- [ ] Review jawaban & pembahasan
- [ ] Tryout / simulasi UTBK / Nasional

### 📊 Modul 6: Absensi
- [ ] Absensi manual oleh guru
- [ ] Absensi QR Code
- [ ] Rekap kehadiran per siswa/kelas
- [ ] Notifikasi ketidakhadiran ke orang tua
- [ ] Laporan absensi bulanan (PDF)
- [ ] Izin & alasan ketidakhadiran

### 🏆 Modul 7: Nilai & Rapor
- [ ] Input nilai ulangan, tugas, ujian
- [ ] Perhitungan nilai otomatis (bobot konfigurabel)
- [ ] Rapor digital per periode
- [ ] Ranking kelas
- [ ] Grafik perkembangan nilai
- [ ] Export rapor ke PDF

### 📈 Modul 8: Analitik & Laporan
- [x] Dashboard admin (stats: siswa, guru, kelas, tagihan, feature flags) — `/admin`
- [ ] Progress belajar per siswa
- [ ] Statistik kehadiran & nilai per kelas
- [ ] Laporan kinerja guru
- [ ] Analitik soal (tingkat kesulitan, daya pembeda)
- [ ] Export laporan (PDF/Excel)

### 💰 Modul 9: Keuangan & Pembayaran
- [x] Halaman daftar tagihan (admin) — `/admin/finance`
- [x] Summary keuangan (total terbayar, belum bayar, jatuh tempo)
- [ ] Form buat tagihan manual
- [ ] Pembayaran online (Midtrans/Xendit) — integrasi gateway
- [ ] Konfirmasi pembayaran manual oleh admin
- [ ] Reminder tagihan otomatis
- [ ] Histori transaksi lengkap
- [ ] Laporan keuangan bulanan (PDF)

### 🔔 Modul 10: Notifikasi & Pengumuman
- [ ] Pengumuman lembaga (broadcast)
- [ ] Notifikasi in-app
- [ ] Notifikasi WhatsApp (via API)
- [ ] Notifikasi email
- [ ] Notifikasi push (PWA)

### 💬 Modul 11: Forum Diskusi & Chat
- [ ] Forum diskusi per mata pelajaran
- [ ] Thread tanya jawab siswa-guru
- [ ] Upvote jawaban terbaik
- [ ] Chat private siswa-guru
- [ ] Group chat per kelas

### 🎥 Modul 12: Kelas Online (Live)
- [ ] Integrasi Zoom / Google Meet
- [ ] Jadwal kelas online
- [ ] Rekaman kelas tersimpan
- [ ] Whiteboard digital
- [ ] Raise hand & polling

### 🎖️ Modul 13: Gamifikasi & Motivasi
- [ ] Poin & badge prestasi
- [ ] Leaderboard siswa
- [ ] Streak belajar harian
- [ ] Sertifikat digital (PDF)
- [ ] Level & XP system

### 👨‍👩‍👧 Modul 14: Portal Orang Tua
- [x] Dashboard orang tua — `/orangtua`
- [x] Lihat nilai anak (terbaru)
- [x] Lihat absensi anak
- [x] Lihat tagihan anak (unpaid)
- [ ] Chat dengan guru
- [ ] Bayar tagihan online
- [ ] Laporan perkembangan anak lengkap
- [ ] Notifikasi real-time

### 📱 Modul 15: PWA & Offline
- [ ] Installable sebagai app (PWA)
- [ ] Akses materi offline (cached)
- [ ] Sinkronisasi otomatis saat online

---

## 📊 Summary Progress

| Modul | Selesai | Total | % |
|-------|---------|-------|---|
| Core Architecture | 13 | 16 | 81% |
| Modul 1: Pengguna | 3 | 9 | 33% |
| Modul 2: Kelas & Jadwal | 1 | 8 | 13% |
| Modul 3: Materi | 7 | 10 | 70% |
| Modul 4: Tugas | 6 | 8 | 75% |
| Modul 5: Ujian | 0 | 7 | 0% |
| Modul 6: Absensi | 0 | 6 | 0% |
| Modul 7: Nilai & Rapor | 0 | 6 | 0% |
| Modul 8: Analitik | 1 | 6 | 17% |
| Modul 9: Keuangan | 2 | 8 | 25% |
| Modul 10: Notifikasi | 0 | 5 | 0% |
| Modul 11: Forum & Chat | 0 | 5 | 0% |
| Modul 12: Kelas Online | 0 | 5 | 0% |
| Modul 13: Gamifikasi | 0 | 5 | 0% |
| Modul 14: Portal Ortu | 4 | 8 | 50% |
| Modul 15: PWA | 0 | 3 | 0% |
| **TOTAL** | **24** | **113** | **21%** |

---

## 📝 Changelog

### 2025-06-16 — Commit `b8fdfdc`
- Setup full project structure (Next.js 15, Prisma, NextAuth v5)
- Core: auth, feature flags, middleware, layouts
- Dashboards: Admin, Guru, Siswa, Orang Tua
- Admin pages: users, classes, finance, features control panel
- API: feature toggle PATCH, features GET
- Deploy: CI/CD GitHub Actions, panduan VPS IDCloudHost
