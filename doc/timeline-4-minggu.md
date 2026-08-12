# Timeline 4 Minggu — Pembangunan Menyeluruh (251 item, 8 tahap)

> Asumsi: **tenaga kerja tidak menjadi masalah** — semua item dari `build-roadmap-checklist.md` (251 item, 8 tahap) dimampatkan ke 4 minggu.
> Item yang sebelumnya ditunda (Zona Tunda 58 item) dan Tahap 8 (28 item) kini masuk ke dalam rencana.
> Referensi nomor bagian (mis. `2.7`) mengacu ke `build-roadmap-checklist.md`.

**Dibuat:** 9 Agustus 2026 · **Revisi:** 11 Agustus 2026
**Asumsi:** Tim fleksibel, banyak jalur paralel, 5 hari kerja/minggu

---

## Progress Saat Ini

| Tahap | Nama | Item | Selesai | Sisa |
|---|---|---|---|---|
| 0 | Persiapan Infrastruktur | 8 | 4 | 4 |
| 1 | Fondasi Data Master & Ruangan | 34 | 32 | 2 |
| 2 | Modul PPDB | 38 | 32 | 6 |
| 3 | Modul Afiliator | 32 | 27 | 5 |
| 4 | Role & Permission | 18 | 0 | 18 |
| 5 | Upgrade CBT | 35 | 0 | 35 |
| 6 | Sertifikat, Payment, Export | 28 | 0 | 28 |
| 7 | Website, Automation, Security | 30 | 0 | 30 |
| 8 | Jurnal Mengajar, Raport & Absensi Tutor | 28 | 0 | 28 |
| **Total** | | **251** | **96** | **155** |

---

## Pembagian Jalur Kerja (6 jalur paralel)

| Jalur | Fokus | Tahap |
|---|---|---|
| **A** | Infrastruktur & Master Data | 0, 1 (sisa) |
| **B** | PPDB & Afiliator (sisa) | 2 (sisa), 3 (sisa) |
| **C** | CBT / Ujian Online | 5 |
| **D** | Payment, Sertifikat & Export | 6 |
| **E** | Website, CMS & Security | 7 |
| **F** | Role, Jurnal, Raport & Absensi Tutor | 4, 8 |

---

## Ringkasan per Minggu

| Minggu | Tema | Milestone |
|---|---|---|
| **1** | Fondasi & Sisa Tahap 1-3 | Migration aktif, master data lengkap, PPDB & afiliator selesai |
| **2** | CBT, Payment & Sertifikat | Media soal, multi-attempt, TOEFL, payment gateway, sertifikat, export |
| **3** | Role, Website & Akademik | Permission granular, landing page, CMS, jurnal mengajar, raport, absensi tutor |
| **4** | Integrasi, Security & Rilis | Security hardening, notifikasi, leaderboard, dashboard final, smoke test, deploy |

---

# MINGGU 1 — FONDASI & PENYELESAIAN TAHAP 1-3

> 🎯 **Milestone:** Migration files aktif, semua sisa Tahap 1-3 selesai, fondasi siap untuk modul besar.

## Jalur A — Infrastruktur & Master Data (Tahap 0 + sisa Tahap 1) · 12 item

### Hari 1 — Setup Infrastruktur (Tahap 0)
- [ ] 🔥 `0.1` Backup penuh database produksi (`pg_dump`) — ⚠️ MANUAL: jalankan di VPS sebelum deploy
- [x] `0.1` Buat baseline migration + `migrate resolve --applied 0_init` — file `prisma/migrations/0_init/migration.sql` dibuat (1397 baris). ⚠️ Jalankan `migrate resolve --applied 0_init` di VPS dengan DATABASE_URL
- [ ] `0.1` Verifikasi `prisma migrate status` bersih — ⚠️ MANUAL: jalankan di VPS setelah `migrate resolve`
- [x] `0.1` Ganti alur deploy `db push` → `migrate deploy` di `doc/deploy-server.md`
- [x] `0.1` Tambah script `db:deploy` ke `package.json`
- [ ] `0.2` Siapkan database staging — ⚠️ MANUAL
- [ ] `0.2` Uji outbound HTTPS VPS (`curl -I https://api.resend.com`) — ⚠️ MANUAL
- [x] `0.2` Buat branch `feat/worldwide-upgrade` + sepakati konvensi commit

### Hari 2-5 — Sisa Tahap 1
- [x] `1.1` Migration `add_program_master` + backfill `Invoice.programId` — sudah ada di baseline migration `0_init`
- [x] `1.1` Halaman `/admin/master/academic-years` — `src/app/admin/master/academic-years/page.tsx` dibuat (CRUD lengkap, API sudah ada)
- [ ] `1.2` Migration 1 (tambah kolom) + verifikasi + Migration 2 (drop kolom lama)
- [ ] `1.2` Update form kelas & jadwal → dropdown ruangan
- [x] `1.3` Pasang validator di POST/PATCH jadwal → `409` + detail bentrok — `checkScheduleConflict` dipasang di `src/app/api/admin/classes/[id]/schedules/route.ts`
- [ ] `1.3` UI peringatan bentrok real-time + unit test 4 skenario
- [x] `1.4` Logic set `TUNGGAKAN` otomatis saat invoice `OVERDUE` — `src/lib/student-status.ts` dibuat, dipanggil di confirm/approve/reject invoice routes
- [x] `1.5` Pasang `logAudit()` di mutasi: Invoice, Payment, Grade, Schedule, User, ClassStudent — semua route sudah ditambah `logAudit()`

## Jalur B — Penyelesaian PPDB & Afiliator (sisa Tahap 2 + 3) · 11 item

### PPDB sisa (Tahap 2)
- [ ] `2.2` Test 50 request paralel → 50 nomor unik
- [x] `2.3` Validasi Zod di client & server — `src/lib/ppdb-validation.ts` (shared schema), field error display di `RegistrationForm`
- [x] `2.3` Tombol "Daftar" di halaman program & landing page → `/daftar?program={slug}` — hero CTA + program cards di `LandingPage.tsx`
- [x] `2.4` `/api/ppdb/upload` — validasi MIME & ukuran per DocumentType + Cloudinary + rate limit 10/min/IP — `src/app/api/ppdb/upload/route.ts`
- [x] `2.7` Kirim kredensial login ke email & WA siswa — `notifyCredentials()` di `src/lib/ppdb-notifications.ts`, dipanggil di convert route
- [x] `2.8` Template notifikasi tiap transisi status PPDB — `notifyPPDBStatus()` di `src/lib/ppdb-notifications.ts`, dipanggil di status & convert route

### Afiliator sisa (Tahap 3)
- [x] `3.3` Trigger komisi dari verifikasi pembayaran invoice — `advanceCommissionStatus(PAYMENT_VERIFIED)` di confirm & approve route
- [x] `3.4` Batasi jumlah referral per IP per hari — max 20 clicks/IP/hari di `src/app/api/ref/[code]/route.ts`
- [x] `3.4` Dedupe `clickCount` per IP dalam jendela waktu — in-memory map per kode+tanggal
- [x] `3.7` Notifikasi: referral baru, komisi valid, pencairan disetujui/ditolak/dibayar — `src/lib/afiliator-notifications.ts` (email + WA + in-app)
- [x] `3.6` Laporan komisi masuk ke laporan keuangan — section "Komisi Afiliator" di `/admin/finance/laporan`

## Jalur C — CBT Bagian 1 (Tahap 5.1-5.2) · 14 item
- [x] `5.1` Tambah `Question.imageUrl/audioUrl/videoUrl` + upload ke Cloudinary — schema + API create question updated
- [x] `5.1` Editor soal sisip media + player audio/video di halaman siswa — `MediaDisplay` di `TakeExamClient` & `EventExamClient`, form upload di `UjianDetailClient`
- [ ] `5.1` Aktifkan `katex` untuk rumus matematika
- [x] 🔥 `5.2` `Exam.materialId`, `Exam.maxAttempts`, `ExamAttempt.attemptNumber` — schema updated, `scoringMode` juga ditambah
- [x] 🔥 `5.2` Hapus `@@unique([examId, studentId])` → ganti `[examId, studentId, attemptNumber]`
- [x] 🔥 `5.2` Perbaiki 7 pemakaian `examId_studentId` di 5 file — semua diganti `findMany`/`count` + `create`
- [x] `5.2` Ganti pola `upsert` → cek `maxAttempts` + `create` dengan `attemptNumber`
- [x] `5.2` Tolak attempt > `maxAttempts` + `Exam.scoringMode` — 403 + pilihan SUM/AVG/BEST/LAST di form
- [ ] `5.2` UI quiz di detail materi siswa

## Jalur D — Payment & Export Helper (Tahap 6.2-6.3) · 12 item
- [ ] 🔥 `6.2` Refactor `event-payment.ts` → `src/lib/payment-gateway.ts` generik
- [ ] 🔥 `6.2` `POST /api/payments/invoice/[id]/checkout`
- [ ] 🔥 `6.2` `POST /api/payments/webhook/midtrans` terpusat
- [ ] 🔥 `6.2` Verifikasi signature webhook + idempotent
- [ ] `6.2` Webhook update Invoice + Payment + BranchTransaction + notifikasi
- [ ] `6.2` Pembayaran PPDB lewat gateway
- [ ] `6.2` Instruksi pembayaran manual yang bisa diatur admin
- [ ] `6.2` Toggle gateway di `/admin/settings`
- [ ] `6.3` `src/lib/export-excel.ts` (pakai `exceljs`)
- [ ] `6.3` `src/lib/export-pdf.ts` (install `pdf-lib`)
- [ ] `6.3` Hapus duplikat `xlsx` dari `package.json`
- [ ] `6.3` Import data siswa dari Excel/CSV + preview + template unduhan

## Jalur E — Website & CMS Awal (Tahap 7.1-7.2) · 13 item
- [ ] `7.1` `model LandingPage` — slug, title, sections, meta, CTA, viewCount
- [ ] `7.1` Route publik `/lp/[slug]` + generateMetadata SEO
- [ ] `7.1` `/admin/landing-pages` — builder berbasis blok (hero, fitur, testimoni, FAQ, CTA, form)
- [ ] `7.1` CTA terhubung ke PPDB / Event / Inquiry + hitung viewCount
- [ ] `7.2` `model SiteFaq` — FAQ dengan kategori
- [ ] `7.2` `model SiteTeamMember` — profil tim/tutor publik
- [ ] `7.2` Struktur organisasi + legalitas lembaga
- [ ] `7.2` Kategori "PRESTASI" pada `SiteGallery` + halaman galeri prestasi
- [ ] `7.2` Halaman publik daftar cabang/lokasi
- [ ] `7.2` Halaman detail program publik `/program/[slug]` (deskripsi, target, jadwal, harga, tombol daftar)
- [ ] `7.2` Halaman visi/misi & profil lembaga
- [ ] `7.2` Audit SEO: sitemap.xml, robots.txt, metadata semua halaman publik

## Jalur F — Role & Permission (Tahap 4.1-4.2) · 9 item
- [ ] 🔥 `4.1` `model Permission` — code, name, module, description
- [ ] 🔥 `4.1` `model RolePermission` — role, permissionCode
- [ ] `4.1` Tambah role baru: `ADMIN_CABANG`, `ADMIN_KEUANGAN`, `ADMIN_AKADEMIK` (AFILIATOR sudah ada)
- [ ] `4.1` Seed permission per modul + mapping default role
- [ ] `4.1` `src/lib/permission.ts` — `hasPermission()`, `requirePermission()` + cache
- [ ] 🔥 `4.2` Inventarisasi semua cek role (grep `SUPER_ADMIN`)
- [ ] `4.2` Ganti guard hardcode → `requirePermission()`, pastikan backward compatible
- [ ] `4.2` Update `src/lib/auth.ts` — permission di session
- [ ] `4.2` Pastikan `ADMIN` lama tetap punya semua permission

## 🔄 Sync Point Jumat Minggu 1
- [ ] `npm run build` + `npm run lint` bersih
- [ ] Semua migration jalan berurutan di staging
- [ ] Demo: PPDB end-to-end + afiliator referral → komisi
- [ ] Demo: payment gateway sandbox → webhook update
- [ ] **DoD Tahap 0, 1, 2, 3 tercentang**

---

# MINGGU 2 — CBT LENGKAP, SERTIFIKAT & EXPORT

> 🎯 **Milestone:** TOEFL berjalan, bank soal reusable, sertifikat ber-QR & PDF, export semua modul, laporan keuangan lengkap.

## Jalur C — CBT Bagian 2 (Tahap 5.3-5.7) · 21 item
- [ ] 🔥🔥 `5.3` `StimulusType`, `QuestionGroup`, `Question.groupId`
- [ ] 🔥 `5.3` `ExamSection` + `Question.sectionId`
- [ ] 🔥 `5.3` UI admin: 1 audio / 1 passage untuk banyak soal
- [ ] 🔥 `5.3` UI siswa: split view passage + soal
- [ ] 🔥 `5.3` Audio: batasi `maxPlayCount`, tidak bisa di-seek
- [ ] 🔥 `5.3` Timer per section + auto-lanjut
- [ ] 🔥 `5.3` Simpan sisa waktu di server (cegah manipulasi client)
- [ ] `5.4` Relasi soal↔ujian → M:N (`ExamQuestion`) + migrasi data
- [ ] `5.4` Halaman `/admin/bank-soal` + pilih soal dari bank
- [ ] `5.4` Statistik soal (tingkat kesulitan aktual)
- [ ] `5.5` Template Word/Excel soal yang bisa diunduh
- [ ] `5.5` Parser `.docx` pakai `mammoth` + parser `.xlsx` pakai `exceljs`
- [ ] `5.5` Preview hasil parsing + laporan baris gagal
- [ ] `5.5` Export bank soal ke Excel & PDF
- [ ] `5.6` Pilih provider AI (Gemini/OpenAI) + simpan API key di env
- [ ] `5.6` `POST /api/admin/ujian/ai-generate` — input topik, mapel, jumlah, tipe
- [ ] `5.6` Output draft yang wajib direview admin + rate limit + logging
- [ ] `5.6` Tambah `FEAT_AI_QUESTION` ke `FEATURE_CODES`
- [ ] `5.7` `Exam.shuffleOptions` — acak pilihan jawaban
- [ ] `5.7` Antarmuka penilaian essay manual per soal
- [ ] `5.7` Analisis hasil belajar + generate rapor PDF + auto-submit saat waktu habis

## Jalur D — Sertifikat & Laporan (Tahap 6.1, 6.4) · 16 item
- [ ] 🔥 `6.1` `CertificateTemplate` + `Certificate.templateId` & `certificateNo @unique`
- [ ] `6.1` Generator nomor sertifikat otomatis
- [ ] `6.1` QR Code (pakai `qrcode.react` + `qrcode` server-side)
- [ ] `6.1` Generate PDF (`pdf-lib`) + tombol download di dashboard siswa
- [ ] `6.1` Editor posisi field di atas template
- [ ] `6.1` Perkaya `/sertifikat/[code]` + `/admin/sertifikat/templates`
- [ ] `6.1` Trigger otomatis saat syarat LMS terpenuhi
- [ ] `6.4` Laporan harian, mingguan, tahunan
- [ ] `6.4` Pendapatan per program (pakai `Invoice.programId`) + per cabang
- [ ] `6.4` Pengeluaran per kategori + laba/rugi + piutang
- [ ] `6.4` Komisi afiliator masuk laporan
- [ ] `6.3` Pasang tombol Export Excel/PDF di semua modul utama
- [ ] `6.3` Export menghormati filter & scope cabang

## Jalur E — Absensi Tutor & Payroll (Tahap 7.3) · 6 item
- [ ] `7.3` `model TeacherAttendance` — teacherId, classId, scheduleId, date, checkIn/out, status
- [ ] `7.3` UI absensi tutor + rekap kehadiran
- [ ] `7.3` Absensi via QR Code (`FEAT_ATTENDANCE_QR` sudah ada)
- [ ] `7.3` Absensi via kode kelas
- [ ] `7.3` `model TeacherPayroll` — rate per pertemuan/jam × kehadiran
- [ ] `7.3` Laporan honor tutor + export

## Jalur F — Scope Cabang & Dashboard Role (Tahap 4.3-4.4) · 9 item
- [ ] 🔥🔥 `4.3` Audit semua query lintas cabang
- [ ] 🔥 `4.3` `ADMIN_CABANG` terisolasi (siswa, kelas, jadwal, invoice, PPDB, transaksi)
- [ ] 🔥 `4.3` Tolak akses `[id]` lintas cabang (detail/PATCH/DELETE)
- [ ] 🔥 `4.3` Test: login admin cabang A, akses ID cabang B → 403
- [ ] `4.4` Dashboard Admin Cabang — siswa, pendaftaran, kelas, jadwal, tutor, pembayaran
- [ ] `4.4` Dashboard Admin Keuangan — fokus pembayaran, pemasukan, pengeluaran, laporan
- [ ] `4.4` Dashboard Admin Akademik — program, kelas, tutor, jadwal, siswa
- [ ] `4.4` Menu sidebar dinamis per permission
- [ ] `4.4` Halaman `/admin/users` — pilihan role diperluas + assign cabang

## 🔄 Sync Point Jumat Minggu 2
- [ ] Demo TOEFL: 1 audio untuk 5 soal, batas 1× putar, timer per section
- [ ] Demo sertifikat: generate PDF dengan QR Code
- [ ] Demo AI Question Generator: generate 10 soal dari topik
- [ ] Demo export Excel/PDF di modul siswa & keuangan
- [ ] **DoD Tahap 4 & 5 tercentang**

---

# MINGGU 3 — WEBSITE, AUTOMATION & AKADEMIK

> 🎯 **Milestone:** Notifikasi terjadwal, announcement diperluas, leaderboard event, jurnal mengajar, raport & absensi tutor lengkap.

## Jalur E — Notifikasi, Announcement & Leaderboard (Tahap 7.4-7.6, 7.8) · 18 item
- [ ] `7.4` `model NotificationTemplate` — template WA & Email yang bisa diedit admin
- [ ] `7.4` Scheduler (cron / node-cron) untuk reminder pembayaran (H-3, H-1, H+1)
- [ ] `7.4` Scheduler reminder jadwal kelas + update `StudentStatus` → `TUNGGAKAN` otomatis
- [ ] `7.4` Trigger notifikasi: perubahan jadwal, hasil ujian, sertifikat tersedia
- [ ] `7.4` Halaman `/admin/notifications/templates` + log pengiriman
- [ ] `7.5` Tambah `Announcement`: targetBranchIds, targetProgramIds, targetClassIds, imageUrl, attachmentUrl, startDate, endDate
- [ ] `7.5` Filter penerima berdasarkan target gabungan + kedaluwarsa otomatis
- [ ] `7.6` Tambah `Event`: rankingCriteria, autoRanking
- [ ] `7.6` Mesin ranking dengan tie-breaker (nilai → waktu → kriteria lain)
- [ ] `7.6` Penentuan otomatis Juara 1/2/3 & Top 10
- [ ] `7.6` Halaman leaderboard publik per event
- [ ] `7.6` Pengumuman pemenang + trigger sertifikat pemenang
- [ ] `7.8` Dashboard Super Admin lengkap: total cabang, calon siswa, komisi, event, piutang, tunggakan
- [ ] `7.8` Grafik pertumbuhan siswa & pendapatan (pakai `recharts`)
- [ ] `7.8` Perbandingan performa antar cabang
- [ ] `7.8` Dashboard siswa: tambah kartu sertifikat & referral
- [ ] `7.8` Automatic reporting (laporan periodik via email)
- [ ] `7.8` Dashboard Admin Cabang final (Bab 11)

## Jalur F — Jurnal Mengajar (Tahap 8.1) · 11 item
- [ ] `8.1` `model TeachingJournal` — classId, scheduleId, teacherId, date, materialCovered, methodology, studentResponse, challenges, reflection, nextPlan, status
- [ ] `8.1` Migration `add_teaching_journal`
- [ ] `8.1` `GET /api/guru/jurnal` — list jurnal tutor (scoped per kelas/tanggal)
- [ ] `8.1` `POST /api/guru/jurnal` — buat/edit jurnal per pertemuan
- [ ] `8.1` `PATCH /api/guru/jurnal/[id]` — update jurnal (hanya pemilik atau admin)
- [ ] `8.1` `GET /api/admin/jurnal` — admin lihat semua jurnal (filter cabang/tutor/kelas/tanggal)
- [ ] `8.1` `GET /api/orangtua/jurnal` — orang tua lihat jurnal kelas anak
- [ ] `8.1` Halaman `/guru/jurnal` — form input jurnal + riwayat
- [ ] `8.1` Halaman `/admin/jurnal` — tabel rekap jurnal semua tutor
- [ ] `8.1` Widget jurnal terbaru di dashboard admin akademik
- [ ] `8.1` Orang tua lihat jurnal kelas anak di `/orangtua/progress` + `FEAT_TEACHING_JOURNAL`

## Jalur F (lanjutan) — Raport & Laporan Siswa (Tahap 8.2) · 17 item
- [ ] `8.2` `model ReportPeriod` — name, academicYearId, startDate, endDate, isActive
- [ ] `8.2` `model ReportCard` — studentId, classId, periodId, homeroomTeacherId, homeroomComment, attendanceSummary, overallScore, rank, status, publishedAt
- [ ] `8.2` `model ReportCardDetail` — reportCardId, subjectName, averageScore, gradeLetter, teacherComment, components
- [ ] `8.2` Migration `add_report_card`
- [ ] `8.2` `GET/POST /api/admin/report-periods` — CRUD periode rapor
- [ ] `8.2` `POST /api/admin/raport/generate` — generate rapor massal per kelas + periode
- [ ] `8.2` `GET /api/admin/raport` — list rapor (filter kelas/periode/siswa)
- [ ] `8.2` `GET /api/admin/raport/[id]` — detail rapor + semua mata pelajaran
- [ ] `8.2` `PATCH /api/admin/raport/[id]` — edit komentar wali kelas + komentar per mapel
- [ ] `8.2` `POST /api/admin/raport/[id]/publish` — publish rapor
- [ ] `8.2` `GET /api/orangtua/raport` — list rapor anak yang dipublish
- [ ] `8.2` `GET /api/orangtua/raport/[id]` — detail rapor anak
- [ ] `8.2` `GET /api/siswa/raport` — siswa lihat rapor sendiri
- [ ] `8.2` `GET /api/admin/raport/[id]/pdf` — generate PDF rapor (pakai `pdf-lib`)
- [ ] `8.2` `GET /api/admin/raport/export` — export Excel rekap nilai
- [ ] `8.2` Halaman `/admin/raport/periode` + `/admin/raport` + `/admin/raport/[id]`
- [ ] `8.2` Halaman `/orangtua/raport` + `/orangtua/raport/[id]` + `/siswa/raport` + `FEAT_REPORT_CARD`

## Jalur F (lanjutan) — Absensi Tutor & Payroll (Tahap 8.3) · 11 item
- [ ] `8.3` `model TeacherAttendance` (diperluas dari 7.3) + `model TeacherPayroll`
- [ ] `8.3` Migration `add_teacher_attendance_payroll`
- [ ] `8.3` `POST /api/guru/absensi-tutor` — check-in/check-out (manual/QR/kode)
- [ ] `8.3` `GET /api/guru/absensi-tutor` — riwayat absensi sendiri
- [ ] `8.3` `GET /api/admin/absensi-tutor` — admin lihat semua absensi tutor
- [ ] `8.3` `POST /api/admin/absensi-tutor/[id]/verify` — verifikasi absensi
- [ ] `8.3` `POST /api/admin/payroll/generate` — generate payroll per tutor + periode
- [ ] `8.3` `GET /api/admin/payroll` + `PATCH /api/admin/payroll/[id]` + `GET /api/admin/payroll/[id]/pdf`
- [ ] `8.3` `GET /api/admin/payroll/export` — export Excel rekap honor
- [ ] `8.3` Halaman `/guru/absensi-tutor` + QR code + `/admin/absensi-tutor` + `/admin/payroll` + `/admin/payroll/[id]`
- [ ] `8.3` `FEAT_TEACHER_ATTENDANCE` & `FEAT_PAYROLL` ke `FEATURE_CODES`

## Jalur F (lanjutan) — Notifikasi Terkait (Tahap 8.4) · 4 item
- [ ] `8.4` Notifikasi ke orang tua saat rapor dipublish (WA + Email + in-app)
- [ ] `8.4` Notifikasi ke admin saat tutor belum isi jurnal setelah pertemuan
- [ ] `8.4` Notifikasi ke tutor saat payroll disetujui/dibayar
- [ ] `8.4` Notifikasi ke admin saat tutor tidak hadir (ALPHA)

## 🔄 Sync Point Jumat Minggu 3
- [ ] Demo jurnal mengajar: tutor input → admin lihat → orang tua lihat
- [ ] Demo raport: generate massal → edit komentar → publish → orang tua lihat → cetak PDF
- [ ] Demo absensi tutor QR + payroll generate → slip PDF
- [ ] Demo notifikasi terjadwal: reminder pembayaran
- [ ] Demo leaderboard event: ranking otomatis + sertifikat pemenang
- [ ] **DoD Tahap 7 & 8 tercentang**

---

# MINGGU 4 — INTEGRASI, SECURITY & RILIS

> 🎯 **Milestone:** Security hardening, smoke test seluruh alur, deploy ke produksi.

## Hari 1-2 — Security Hardening (Tahap 7.7) · 7 item
- [ ] 🔥 `7.7` Rate limiting untuk login, register, form publik, upload, AI generator
- [ ] 🔥 `7.7` Validasi upload file ketat di server (MIME asli, bukan hanya ekstensi)
- [ ] 🔥 `7.7` Script backup database otomatis + cron + **uji restore**
- [ ] `7.7` Lock nilai final (butuh permission khusus, tercatat di audit log)
- [ ] `7.7` Review header keamanan di `next.config.ts` (CSP, X-Frame-Options)
- [ ] `7.7` Kebijakan kekuatan password + fitur lupa password
- [ ] `7.7` Uji akses lintas cabang & lintas role menyeluruh

## Hari 2-3 — Integrasi & Polish · semua jalur
- [ ] Integrasi PPDB ↔ Afiliator: referral → verifikasi → bayar → komisi VALID
- [ ] Integrasi Payment ↔ Afiliator: webhook pembayaran → advance komisi
- [ ] Integrasi Sertifikat ↔ Event: pemenang event → sertifikat otomatis
- [ ] Integrasi Raport ↔ Absensi: rekap absensi masuk raport
- [ ] Integrasi Jurnal ↔ Absensi Tutor: jurnal terisi → absensi terverifikasi
- [ ] Integrasi Landing Page ↔ PPDB: CTA → form daftar
- [ ] Pasang audit log di semua mutasi tersisa
- [ ] Pasang export Excel/PDF di modul yang belum (afiliator, jurnal, raport, payroll)

## Hari 3-4 — Smoke Test Menyeluruh
- [ ] Alur PPDB: daftar → upload dokumen → verifikasi → bayar → konversi siswa → kelas → jadwal
- [ ] Alur Afiliator: klik link → daftar → verifikasi → bayar → komisi VALID → pencairan
- [ ] Alur CBT: buat soal media → susun ujian → TOEFL (audio + section timer) → multi-attempt → nilai
- [ ] Alur Sertifikat: syarat terpenuhi → generate PDF + QR → siswa download → verifikasi publik
- [ ] Alur Akademik: jurnal mengajar → raport generate → publish → orang tua lihat → cetak PDF
- [ ] Alur Payroll: absensi tutor → generate payroll → approve → slip PDF
- [ ] Alur Keuangan: invoice → bayar online → webhook → laporan pendapatan per program
- [ ] Alur Website: landing page → CTA daftar → PPDB
- [ ] Uji anti-fraud: self-referral ditolak, duplikasi terdeteksi
- [ ] Uji isolasi cabang: admin cabang A tidak bisa akses data cabang B
- [ ] Uji permission: setiap role hanya melihat menu & data yang berhak

## Hari 4-5 — Deploy ke Produksi
- [ ] Checklist Rilis (Lampiran E `build-roadmap-checklist.md`) tercentang penuh
- [ ] Backup produksi sebelum deploy
- [ ] `prisma migrate deploy` di produksi (semua migration berurutan)
- [ ] Smoke test di produksi: PPDB → siswa → kelas → ujian → nilai → sertifikat
- [ ] Smoke test: afiliator → referral → komisi → pencairan
- [ ] Smoke test: TOEFL → multi-attempt → nilai
- [ ] Smoke test: raport → publish → orang tua lihat
- [ ] Smoke test: payroll → slip PDF
- [ ] Cek `pm2 logs` bersih
- [ ] Verifikasi backup otomatis berjalan

## 🔄 Sync Point Jumat Minggu 4 — RILIS
- [ ] **DoD Tahap 6 tercentang**
- [ ] Semua 8 tahap selesai
- [ ] 251 item tercentang
- [ ] Sistem live di produksi

---

# Kalender Ringkas

| | Jalur A | Jalur B | Jalur C | Jalur D | Jalur E | Jalur F |
|---|---|---|---|---|---|---|
| **M1** | Infra + Master | PPDB + Afiliator sisa | CBT media + multi-attempt | Payment + Export | Landing page + CMS | Role & permission |
| **M2** | — | — | TOEFL + bank soal + AI | Sertifikat + laporan | Absensi tutor + payroll | Scope cabang + dashboard |
| **M3** | — | — | — | — | Notifikasi + leaderboard + dashboard final | Jurnal + raport + absensi tutor + payroll |
| **M4** | — | — | — | — | — | Security + integrasi + smoke test + deploy |

---

# Aturan Operasional

## Ritme Harian
- Standup 15 menit pagi: kemarin / hari ini / blocker
- Push ke branch masing-masing minimal 1× sehari
- Merge ke `feat/worldwide-upgrade` minimal 2× seminggu

## Aturan Migration (WAJIB — banyak dev di 1 schema)
- 🔥 **Satu migration per hari per developer maksimal**
- 🔥 Sebelum bikin migration: `git pull` + `prisma migrate dev` dulu
- 🔥 Umumkan di grup sebelum menjalankan migration destruktif
- 🔥 Migration destruktif hanya hari Selasa/Rabu — jangan Jumat

## Definition of Done per Item
- Kode jalan di lokal + `npm run build` lolos
- Guard role/permission terpasang
- `logAudit()` dipanggil bila mutasi penting
- Diuji di staging
- Feature flag dibuat bila fitur baru

---

# Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| `5.3` TOEFL meledak jadi 6-7 hari | Jalur C slip | Mulai desain di Minggu 1, coding di Minggu 2 |
| Konflik migration antar banyak dev | Build rusak berhari-hari | Aturan 1 migration/hari/dev + pull sebelum bikin |
| `4.2` guard hardcode lebih banyak dari perkiraan | Role migration tidak selesai | Inventarisasi grep di awal Minggu 1 |
| Migrasi `room` gagal map sebagian | Data jadwal kacau | Script cetak laporan gagal + jangan drop kolom lama sampai terverifikasi |
| `8.2` raport generate kompleks | Jalur F slip Minggu 3 | Mulai schema raport di Minggu 2 paralel |
| Integrasi antar modul di Minggu 4 terlalu padat | Rilis slip | Mulai integrasi bertahap di akhir Minggu 3 |
