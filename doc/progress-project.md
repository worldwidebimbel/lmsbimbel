# Progress Project — EduBimbel LMS

**Last updated:** 2026-06-16  
**Commit:** `(latest)` — feat: halaman profil pengguna + ganti password + nav header  
**Build status:** ✅ Clean (78 routes)  
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
- [x] Guru: daftar ujian — `/guru/ujian`
- [x] Guru: buat ujian (judul, durasi, KKM, jadwal, acak soal) — `/guru/ujian/new`
- [x] Guru: kelola soal (pilgan/esai/benar-salah) + lihat hasil — `/guru/ujian/[id]`
- [x] Guru: publish/unpublish ujian
- [x] Siswa: daftar ujian tersedia — `/siswa/ujian`
- [x] Siswa: kerjakan ujian dengan timer countdown — `/siswa/ujian/[id]`
- [x] Auto-koreksi pilgan + skor otomatis
- [x] API: CRUD ujian, soal, submit jawaban
- [ ] Bank soal bersama (lintas ujian)
- [ ] Tryout / simulasi UTBK / Nasional

### 📊 Modul 6: Absensi
- [x] API sesi absensi (`GET/POST /api/absensi`, `GET/DELETE /api/absensi/[id]`)
- [x] API input rekap (`POST /api/absensi/[id]/records`)
- [x] Guru: daftar sesi + buat sesi + input per siswa (HADIR/SAKIT/IZIN/ALPHA) — `/guru/absensi`
- [x] Siswa: rekap kehadiran + persentase + tabel riwayat — `/siswa/absensi`
- [ ] Absensi QR Code
- [ ] Notifikasi ketidakhadiran ke orang tua
- [ ] Laporan absensi bulanan (PDF)

### 🏆 Modul 7: Nilai & Rapor
- [x] API komponen nilai (`GET/POST /api/nilai/components`, `DELETE /api/nilai/components/[id]`)
- [x] API input/rekap nilai (`GET/POST /api/nilai`)
- [x] Guru: tabel input nilai per siswa + komponen bobot + ranking — `/guru/nilai`
- [x] Siswa: rekap nilai per kelas + nilai akhir + progress bar — `/siswa/nilai`
- [ ] Rapor digital (cetak PDF)
- [ ] Grafik perkembangan nilai
- [ ] Export Excel

### 📈 Modul 8: Analitik & Laporan
- [x] Dashboard admin (stats: siswa, guru, kelas, tagihan, feature flags) — `/admin`
- [x] Halaman analitik lengkap (KPI, absensi, nilai, keuangan, tabel kelas) — `/admin/analytics`
- [ ] Progress belajar per siswa
- [ ] Statistik kehadiran & nilai per kelas
- [ ] Laporan kinerja guru
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
- [ ] Konfirmasi pembayaran manual oleh admin
- [ ] Reminder tagihan otomatis
- [ ] Histori transaksi lengkap
- [ ] Laporan keuangan bulanan (PDF)

### 🔔 Modul 10: Notifikasi & Pengumuman
- [x] Notifikasi in-app — `GET /api/notifications`
- [x] Tandai dibaca (satu/semua) — `POST /api/notifications/read`
- [x] Bell icon header real-time (polling 60s) — `NotificationBell.tsx`
- [x] Halaman notifikasi — `/notifikasi`
- [x] Broadcast pengumuman admin — `/admin/announcements`
- [x] API broadcast — `POST /api/admin/announcements`
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
- [x] Progress anak lengkap (nilai, tugas, ujian, absensi, kelas) — `/orangtua/progress`
- [x] Tagihan anak lengkap + riwayat + progress bayar — `/orangtua/tagihan`
- [ ] Chat dengan guru
- [ ] Bayar tagihan online

### 📱 Modul 15: PWA & Offline
- [ ] Installable sebagai app (PWA)
- [ ] Akses materi offline (cached)
- [ ] Sinkronisasi otomatis saat online

---

## 📊 Summary Progress

| Modul | Selesai | Total | % |
|-------|---------|-------|---|
| Core Architecture | 13 | 16 | 81% |
| Modul 1: Pengguna | 7 | 9 | 78% |
| Modul 2: Kelas & Jadwal | 7 | 8 | 88% |
| Modul 3: Materi | 7 | 10 | 70% |
| Modul 4: Tugas | 6 | 8 | 75% |
| Modul 5: Ujian | 8 | 9 | 89% |
| Modul 6: Absensi | 4 | 7 | 57% |
| Modul 7: Nilai & Rapor | 4 | 7 | 57% |
| Modul 8: Analitik | 2 | 6 | 33% |
| Modul 9: Keuangan | 6 | 8 | 75% |
| Modul 10: Notifikasi | 6 | 9 | 67% |
| Modul 11: Forum & Chat | 0 | 5 | 0% |
| Modul 12: Kelas Online | 0 | 5 | 0% |
| Modul 13: Gamifikasi | 0 | 5 | 0% |
| Modul 14: Portal Ortu | 6 | 8 | 75% |
| Modul 15: PWA | 0 | 3 | 0% |
| **TOTAL** | **56** | **117** | **48%** |

---

## 📝 Changelog

### 2025-06-16 — Commit `b8fdfdc`
- Setup full project structure (Next.js 15, Prisma, NextAuth v5)
- Core: auth, feature flags, middleware, layouts
- Dashboards: Admin, Guru, Siswa, Orang Tua
- Admin pages: users, classes, finance, features control panel
- API: feature toggle PATCH, features GET
- Deploy: CI/CD GitHub Actions, panduan VPS IDCloudHost
