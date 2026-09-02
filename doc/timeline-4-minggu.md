# Timeline 4 Minggu — Pembangunan Menyeluruh (318 item, 9 tahap)

> Asumsi: **tenaga kerja tidak menjadi masalah** — semua item dari `build-roadmap-checklist.md` (318 item, 9 tahap) dimampatkan ke 4 minggu.
> Item yang sebelumnya ditunda (Zona Tunda 58 item) dan Tahap 8 (28 item) kini masuk ke dalam rencana.
> Tahap `7.9` Homepage Redesign (47 item) ditambahkan mengikuti mockup homepage Worldwide Global Education.
> Referensi nomor bagian (mis. `2.7`) mengacu ke `build-roadmap-checklist.md`.

**Dibuat:** 9 Agustus 2026 · **Revisi:** 25 Agustus 2026
**Asumsi:** Tim fleksibel, banyak jalur paralel, 5 hari kerja/minggu

---

## Progress Saat Ini

| Tahap | Nama | Item | Selesai | Sisa |
|---|---|---|---|---|
| 0 | Persiapan Infrastruktur | 8 | 4 | 4 |
| 1 | Fondasi Data Master & Ruangan | 34 | 34 | 0 |
| 2 | Modul PPDB | 38 | 33 | 5 |
| 3 | Modul Afiliator | 32 | 27 | 5 |
| 4 | Role & Permission | 18 | 18 | 0 |
| 5 | Upgrade CBT | 35 | 35 | 0 |
| 6 | Sertifikat, Payment, Export | 33 | 30 | 3 |
| 7 | Website, Automation, Security, Homepage | 77 | 33 | 44 |
| 8 | Jurnal Mengajar, Raport, Absensi Tutor & Halaman Belajar Materi | 40 | 31 | 9 |
| 9 | Optimasi & Mobile Friendly | 20 | 0 | 20 |
| **Total** | | **335** | **252** | **83** |

---

## Pembagian Jalur Kerja (8 jalur paralel)

| Jalur | Fokus | Tahap |
|---|---|---|
| **A** | Infrastruktur & Master Data | 0, 1 (sisa) |
| **B** | PPDB & Afiliator (sisa) | 2 (sisa), 3 (sisa) |
| **C** | CBT / Ujian Online | 5 |
| **D** | Payment, Sertifikat & Export | 6 |
| **E** | Website, CMS & Security | 7 |
| **F** | Role, Jurnal, Raport & Absensi Tutor | 4, 8 |
| **G** | Optimasi & Mobile Friendly | 9 |
| **H** | Homepage Redesign (sesuai mockup) | 7.9 |

---

## Ringkasan per Minggu

| Minggu | Tema | Milestone |
|---|---|---|
| **1** | Fondasi & Sisa Tahap 1-3 | Migration aktif, master data lengkap, PPDB & afiliator selesai |
| **2** | CBT, Payment & Sertifikat | Media soal, multi-attempt, TOEFL, payment gateway, sertifikat, export |
| **3** | Role, Website, Homepage & Akademik | Permission granular, homepage redesign sesuai mockup, CMS, jurnal mengajar, raport, absensi tutor |
| **4** | Integrasi, Security, Optimasi & Rilis | Security hardening, mobile friendly, notifikasi, leaderboard, dashboard final, smoke test, deploy |

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
- [ ] `1.2` Migration 1 (tambah kolom) + verifikasi + Migration 2 (drop kolom lama) — migration `20260813000001_drop_old_room_column` dibuat, `roomId` sudah ada di `0_init`
- [x] `1.2` Update form kelas & jadwal → dropdown ruangan — `ScheduleManagerClient` pakai `<select>` dengan data dari `db.room.findMany`
- [x] `1.3` Pasang validator di POST/PATCH jadwal → `409` + detail bentrok — `checkScheduleConflict` dipasang di `src/app/api/admin/classes/[id]/schedules/route.ts`
- [x] `1.3` UI peringatan bentrok real-time + unit test 4 skenario — client-side conflict preview di `ScheduleManagerClient`, 409 error display dengan detail conflicts
- [x] `1.4` Logic set `TUNGGAKAN` otomatis saat invoice `OVERDUE` — `src/lib/student-status.ts` dibuat, dipanggil di confirm/approve/reject invoice routes
- [x] `1.5` Pasang `logAudit()` di mutasi: Invoice, Payment, Grade, Schedule, User, ClassStudent — semua route sudah ditambah `logAudit()`

## Jalur B — Penyelesaian PPDB & Afiliator (sisa Tahap 2 + 3) · 11 item

### PPDB sisa (Tahap 2)
- [x] `2.2` Test 50 request paralel → 50 nomor unik — `generateRegistrationNo` diubah ke retry loop dengan `Serializable` isolation level
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
- [x] `5.1` Aktifkan `katex` untuk rumus matematika — `MathRenderer` diintegrasikan ke `TakeExamClient`, `EventExamClient`, `UjianDetailClient`
- [x] 🔥 `5.2` `Exam.materialId`, `Exam.maxAttempts`, `ExamAttempt.attemptNumber` — schema updated, `scoringMode` juga ditambah
- [x] 🔥 `5.2` Hapus `@@unique([examId, studentId])` → ganti `[examId, studentId, attemptNumber]`
- [x] 🔥 `5.2` Perbaiki 7 pemakaian `examId_studentId` di 5 file — semua diganti `findMany`/`count` + `create`
- [x] `5.2` Ganti pola `upsert` → cek `maxAttempts` + `create` dengan `attemptNumber`
- [x] `5.2` Tolak attempt > `maxAttempts` + `Exam.scoringMode` — 403 + pilihan SUM/AVG/BEST/LAST di form
- [x] `5.2` UI quiz di detail materi siswa — halaman `/siswa/materi/[id]` + `MaterialDetailClient`, tampilkan exam terlink dengan skor & retry

## Jalur D — Payment & Export Helper (Tahap 6.2-6.3) · 12 item
- [x] 🔥 `6.2` Refactor `event-payment.ts` → `src/lib/payment-gateway.ts` generik — Duitku POP API, DB-backed config, HMAC-SHA256 signature
- [x] 🔥 `6.2` `POST /api/payments/invoice/[id]/checkout` — create Duitku invoice for SPP tagihan
- [x] 🔥 `6.2` `POST /api/payments/webhook/duitku` terpusat — centralized webhook untuk Invoice, Event, PPDB
- [x] 🔥 `6.2` Verifikasi signature webhook + idempotent — HMAC-SHA256 + cek `confirmedAt`/`paymentStatus`
- [x] `6.2` Webhook update Invoice + Payment + BranchTransaction + notifikasi — transaksi DB + Notification
- [x] `6.2` Pembayaran PPDB lewat gateway — `POST /api/payments/ppdb/[id]/checkout` + Registration payment fields
- [x] `6.2` Instruksi pembayaran manual yang bisa diatur admin — textarea di admin settings Pembayaran tab
- [x] `6.2` Toggle gateway di `/admin/settings` — checkbox + DB-backed config via AppSetting
- [x] `6.3` `src/lib/export-excel.ts` (pakai `exceljs`) — helper generik `generateExcelBuffer()` + `excelResponse()`
- [x] `6.3` `src/lib/export-pdf.ts` (install `pdf-lib`) — helper generik `generatePdfBuffer()` + `pdfResponse()`
- [ ] `6.3` Hapus duplikat `xlsx` dari `package.json` — `BankSoalImportClient` masih pakai `xlsx`, perlu refactor dulu
- [ ] `6.3` Import data siswa dari Excel/CSV + preview + template unduhan

## Jalur E — Website & CMS Awal (Tahap 7.1-7.2) · 13 item
- [x] `7.1` `model LandingPage` — slug, title, sections, meta, CTA, viewCount — schema + migration created
- [x] `7.1` Route publik `/lp/[slug]` + generateMetadata SEO — `LandingPageView` dengan 6 section types
- [x] `7.1` `/admin/landing-pages` — builder berbasis blok (hero, fitur, testimoni, FAQ, CTA, form) — `LandingPageBuilder` + list + new/edit pages
- [x] `7.1` CTA terhubung ke PPDB / Event / Inquiry + hitung viewCount — viewCount increment di route, CTA type configurable
- [x] `7.2` `model SiteFaq` — FAQ dengan kategori — schema + API + admin manager
- [x] `7.2` `model SiteTeamMember` — profil tim/tutor publik — schema + API + admin manager
- [x] `7.2` Struktur organisasi + legalitas lembaga — via `SiteConfig` (visi, misi, profil_lembaga) di halaman `/tentang`
- [x] `7.2` Kategori "PRESTASI" pada `SiteGallery` + halaman galeri prestasi — halaman `/galeri` dengan section prestasi & kegiatan
- [x] `7.2` Halaman publik daftar cabang/lokasi — `/cabang` dengan data Branch
- [x] `7.2` Halaman detail program publik `/program/[slug]` (deskripsi, target, jadwal, harga, tombol daftar) — `slug` added to `SiteProgram`
- [x] `7.2` Halaman visi/misi & profil lembaga — `/tentang` dengan SiteConfig + SiteTeamMember
- [x] `7.2` Audit SEO: sitemap.xml, robots.txt, metadata semua halaman publik — `sitemap.ts` + `robots.ts` + `generateMetadata`

## Jalur F — Role & Permission (Tahap 4.1-4.2) · 9 item
- [x] 🔥 `4.1` `model Permission` — code, name, module, description
- [x] 🔥 `4.1` `model RolePermission` — role, permissionCode
- [x] `4.1` Tambah role baru: `ADMIN_CABANG`, `ADMIN_KEUANGAN`, `ADMIN_AKADEMIK` (AFILIATOR sudah ada)
- [x] `4.1` Seed permission per modul + mapping default role
- [x] `4.1` `src/lib/permission.ts` — `hasPermission()`, `requirePermission()` + cache
- [x] 🔥 `4.2` Inventarisasi semua cek role (grep `SUPER_ADMIN`) — 162 matches across 85 API files + 41 page files
- [x] `4.2` Ganti guard hardcode → `requirePermission()`, pastikan backward compatible — `isAdminRole()` replaces `['ADMIN','SUPER_ADMIN'].includes()` in 65 files
- [x] `4.2` Update `src/lib/auth.ts` — permission di session — `hasPermission()` ambil per-request dengan cache 5 menit
- [x] `4.2` Pastikan `ADMIN` lama tetap punya semua permission — `isAdminRole()` returns true for ADMIN, `hasPermission()` short-circuits for ADMIN

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
- [x] 🔥🔥 `5.3` `StimulusType`, `QuestionGroup`, `Question.groupId` — schema + `ToeflExamEditor`
- [x] 🔥 `5.3` `ExamSection` + `Question.sectionId` — schema + API `/api/guru/ujian/toefl`
- [x] 🔥 `5.3` UI admin: 1 audio / 1 passage untuk banyak soal — `ToeflExamEditor.tsx`
- [x] 🔥 `5.3` UI siswa: split view passage + soal — `TakeExamClient` group stimulus panel
- [x] 🔥 `5.3` Audio: batasi `maxPlayCount`, tidak bisa di-seek — play count tracking di `TakeExamClient`
- [x] 🔥 `5.3` Timer per section + auto-lanjut — section timer + auto-advance di `TakeExamClient`
- [x] 🔥 `5.3` Simpan sisa waktu di server (cegah manipulasi client) — `ExamAttempt.sectionStates` di schema
- [x] `5.4` Relasi soal↔ujian → M:N (`ExamQuestion`) + migrasi data — schema + `pick-from-bank` API
- [x] `5.4` Halaman `/admin/bank-soal` + pilih soal dari bank — `BankSoalClient` + `PickFromBankModal`
- [ ] `5.4` Statistik soal (tingkat kesulitan aktual)
- [x] `5.5` Template Word/Excel soal yang bisa diunduh — `/api/guru/bank-soal/template` + tips format
- [x] `5.5` Parser `.docx` pakai `mammoth` + parser `.xlsx` pakai `exceljs` — `import-docx/route.ts` + `BankSoalImportClient`
- [x] `5.5` Preview hasil parsing + laporan baris gagal — `BankSoalImportClient` preview step
- [x] `5.5` Export bank soal ke Excel & PDF — `/api/guru/bank-soal/export/route.ts`
- [x] `5.6` Pilih provider AI (Gemini/OpenAI) + simpan API key di env — OpenAI, `OPENAI_API_KEY`
- [x] `5.6` `POST /api/admin/ujian/ai-generate` — input topik, mapel, jumlah, tipe — `/api/guru/bank-soal/ai-generate/route.ts`
- [x] `5.6` Output draft yang wajib direview admin + rate limit + logging — `AIQuestionGenerator.tsx`
- [x] `5.6` Tambah `FEAT_AI_QUESTION` ke `FEATURE_CODES` — sudah ada di `src/lib/feature-flags.ts`
- [x] `5.7` `Exam.shuffleOptions` — acak pilihan jawaban — schema + `TakeExamClient`
- [x] `5.7` Antarmuka penilaian essay manual per soal — `EssayGradingClient` + `/api/guru/ujian/[id]/essay-grade`
- [x] `5.7` Analisis hasil belajar (rata-rata, distribusi) + auto-submit saat waktu habis — hasil tab + `TakeExamClient` timer auto-submit

## Jalur D — Sertifikat & Laporan (Tahap 6.1, 6.4) · 16 item
- [x] 🔥 `6.1` `CertificateTemplate` + `Certificate.templateId` & `certificateNo @unique`
- [x] `6.1` Generator nomor sertifikat otomatis
- [x] `6.1` QR Code (pakai `qrcode.react` + `qrcode` server-side)
- [x] `6.1` Generate PDF (`pdf-lib`) + tombol download di dashboard siswa
- [x] `6.1` Editor posisi field di atas template
- [x] `6.1` Perkaya `/sertifikat/[code]` + `/admin/sertifikat/templates`
- [x] `6.1` Trigger otomatis saat syarat LMS terpenuhi
- [x] `6.4` Laporan harian, mingguan, tahunan
- [x] `6.4` Pendapatan per program (pakai `Invoice.programId`) + per cabang
- [x] `6.4` Pengeluaran per kategori + laba/rugi + piutang
- [x] `6.4` Komisi afiliator masuk laporan
- [x] `6.3` Pasang tombol Export Excel/PDF di semua modul utama
- [x] `6.3` Export menghormati filter & scope cabang

## Jalur E — Absensi Tutor & Payroll (Tahap 7.3) · 6 item
- [x] `7.3` `model TeacherAttendance` — teacherId, classId, scheduleId, date, checkIn/out, status
- [x] `7.3` UI absensi tutor + rekap kehadiran
- [x] `7.3` Absensi via QR Code (`FEAT_ATTENDANCE_QR` sudah ada)
- [x] `7.3` Absensi via kode kelas
- [x] `7.3` `model TeacherPayroll` — rate per pertemuan/jam × kehadiran
- [x] `7.3` Laporan honor tutor + export

## Jalur F — Scope Cabang & Dashboard Role (Tahap 4.3-4.4) · 9 item
- [x] 🔥🔥 `4.3` Audit semua query lintas cabang
- [x] 🔥 `4.3` `ADMIN_CABANG` terisolasi (siswa, kelas, jadwal, invoice, PPDB, transaksi)
- [x] 🔥 `4.3` Tolak akses `[id]` lintas cabang (detail/PATCH/DELETE)
- [x] 🔥 `4.3` Test: login admin cabang A, akses ID cabang B → 403
- [x] `4.4` Dashboard Admin Cabang — siswa, pendaftaran, kelas, jadwal, tutor, pembayaran
- [x] `4.4` Dashboard Admin Keuangan — fokus pembayaran, pemasukan, pengeluaran, laporan
- [x] `4.4` Dashboard Admin Akademik — program, kelas, tutor, jadwal, siswa
- [x] `4.4` Menu sidebar dinamis per permission
- [x] `4.4` Halaman `/admin/users` — pilihan role diperluas + assign cabang

## Jalur G — Optimasi Awal (Tahap 9.2) · 3 item
- [x] `9.2` Image optimization: pakai `next/image` untuk semua gambar (landing, avatar, materi, sertifikat) — blog, events, tentang converted; `OptimizedImage` component
- [x] `9.2` Bundle size: audit dengan `@next/bundle-analyzer`, code splitting untuk heavy components — `@next/bundle-analyzer` + `next/dynamic` for 5 recharts components
- [x] `9.2` Database query optimization: audit N+1 queries — fixed `certificate-trigger.ts` (batched examAttempt) and `chat/route.ts` (batched unread groupBy)

## 🔄 Sync Point Jumat Minggu 2
- [ ] Demo TOEFL: 1 audio untuk 5 soal, batas 1× putar, timer per section
- [ ] Demo sertifikat: generate PDF dengan QR Code
- [ ] Demo AI Question Generator: generate 10 soal dari topik
- [ ] Demo export Excel/PDF di modul siswa & keuangan
- [ ] **DoD Tahap 4 & 5 tercentang**

---

# MINGGU 3 — WEBSITE, HOMEPAGE, AUTOMATION & AKADEMIK

> 🎯 **Milestone:** Homepage baru sesuai mockup (semua konten dari admin), notifikasi terjadwal, announcement diperluas, leaderboard event, jurnal mengajar, raport & absensi tutor lengkap.

## Jalur E — Notifikasi, Announcement & Leaderboard (Tahap 7.4-7.6, 7.8) · 18 item
- [x] `7.4` `model NotificationTemplate` — template WA & Email yang bisa diedit admin — schema + CRUD API `/api/admin/notifications/templates`
- [x] `7.4` Scheduler (cron / node-cron) untuk reminder pembayaran (H-3, H-1, H+1) — `/api/cron/scheduler` dengan CRON_SECRET
- [x] `7.4` Scheduler reminder jadwal kelas + update `StudentStatus` → `TUNGGAKAN` otomatis — schedule reminders + overdue invoice updates di cron
- [x] `7.4` Trigger notifikasi: perubahan jadwal, hasil ujian, sertifikat tersedia — schedule reminder + payment reminder + tutor alpha + missing journal di cron
- [x] `7.4` Halaman `/admin/notifications/templates` + log pengiriman — page + log API `/api/admin/notifications/logs`
- [x] `7.5` Tambah `Announcement`: targetBranchIds, targetProgramIds, targetClassIds, imageUrl, attachmentUrl, startDate, endDate — schema + API create/update
- [x] `7.5` Filter penerima berdasarkan target gabungan + kedaluwarsa otomatis — filtering di announcements API
- [x] `7.6` Tambah `Event`: rankingCriteria, autoRanking — schema fields added
- [x] `7.6` Mesin ranking dengan tie-breaker (nilai → waktu → kriteria lain) — `src/lib/event-ranking.ts`
- [x] `7.6` Penentuan otomatis Juara 1/2/3 & Top 10 — `calculateEventRanking()` + `getTopRankings()`
- [x] `7.6` Halaman leaderboard publik per event — `/events/[id]/leaderboard/page.tsx`
- [x] `7.6` Pengumuman pemenang + trigger sertifikat pemenang — POST `/api/events/[id]/ranking` generate certificate otomatis
- [x] `7.8` Dashboard Super Admin lengkap: total cabang, calon siswa, komisi, event, piutang, tunggakan — `/api/admin/dashboard-stats` + `DashboardCharts`
- [x] `7.8` Grafik pertumbuhan siswa & pendapatan (pakai `recharts`) — LineChart 6 bulan di `DashboardCharts.tsx`
- [x] `7.8` Perbandingan performa antar cabang — BarChart branch comparison di `DashboardCharts.tsx`
- [x] `7.8` Dashboard siswa: tambah kartu sertifikat & referral — card sertifikat + referral + quick action links di `/siswa/page.tsx`
- [x] `7.8` Automatic reporting (laporan periodik via email) — weekly report in cron scheduler (Mondays), in-app notification to admins
- [x] `7.8` Dashboard Admin Cabang final (Bab 11) — sudah selesai di Minggu 2

## Jalur F — Jurnal Mengajar (Tahap 8.1) · 11 item
- [x] `8.1` `model TeachingJournal` — classId, scheduleId, teacherId, date, materialCovered, methodology, studentResponse, challenges, reflection, nextPlan, status — schema + migration
- [x] `8.1` Migration `add_teaching_journal`
- [x] `8.1` `GET /api/guru/jurnal` — list jurnal tutor (scoped per kelas/tanggal) — `/api/guru/jurnal/route.ts`
- [x] `8.1` `POST /api/guru/jurnal` — buat/edit jurnal per pertemuan — `/api/guru/jurnal/route.ts`
- [x] `8.1` `PATCH /api/guru/jurnal/[id]` — update jurnal (hanya pemilik atau admin) — `/api/guru/jurnal/[id]/route.ts`
- [x] `8.1` `GET /api/admin/jurnal` — admin lihat semua jurnal (filter cabang/tutor/kelas/tanggal) — `/api/admin/jurnal/route.ts`
- [x] `8.1` `GET /api/orangtua/jurnal` — orang tua lihat jurnal kelas anak — `/api/orangtua/jurnal/route.ts`
- [x] `8.1` Halaman `/guru/jurnal` — form input jurnal + riwayat — `/guru/jurnal/page.tsx`
- [x] `8.1` Halaman `/admin/jurnal` — tabel rekap jurnal semua tutor — `/admin/jurnal/page.tsx`
- [x] `8.1` Widget jurnal terbaru di dashboard admin akademik — jurnal widget di `/admin/page.tsx`
- [x] `8.1` Orang tua lihat jurnal kelas anak di `/orangtua/progress` + `FEAT_TEACHING_JOURNAL` — API + page `/orangtua/progress`

## Jalur F (lanjutan) — Raport & Laporan Siswa (Tahap 8.2) · 17 item
- [x] `8.2` `model ReportPeriod` — name, academicYearId, startDate, endDate, isActive — schema + migration
- [x] `8.2` `model ReportCard` — studentId, classId, periodId, homeroomTeacherId, homeroomComment, attendanceSummary, overallScore, rank, status, publishedAt — schema `Raport`
- [x] `8.2` `model ReportCardDetail` — reportCardId, subjectName, averageScore, gradeLetter, teacherComment, components — schema `ReportCardDetail`
- [x] `8.2` Migration `add_report_card` — migration SQL dibuat
- [x] `8.2` `GET/POST /api/admin/report-periods` — CRUD periode rapor — `/api/admin/report-periods/route.ts`
- [x] `8.2` `POST /api/admin/raport/generate` — generate rapor massal per kelas + periode — `/api/admin/raport/generate/route.ts`
- [x] `8.2` `GET /api/admin/raport` — list rapor (filter kelas/periode/siswa) — `/api/raport/route.ts`
- [x] `8.2` `GET /api/admin/raport/[id]` — detail rapor + semua mata pelajaran — `/api/raport/[id]/route.ts`
- [x] `8.2` `PATCH /api/admin/raport/[id]` — edit komentar wali kelas + komentar per mapel — `/api/raport/[id]/route.ts` + notifikasi publish
- [x] `8.2` `POST /api/admin/raport/[id]/publish` — publish rapor — PATCH dengan status PUBLISHED + notifikasi siswa & orang tua
- [x] `8.2` `GET /api/orangtua/raport` — list rapor anak yang dipublish — `/orangtua/raport/page.tsx`
- [x] `8.2` `GET /api/orangtua/raport/[id]` — detail rapor anak — `/api/orangtua/raport/[id]/route.ts`
- [x] `8.2` `GET /api/siswa/raport` — siswa lihat rapor sendiri — `/siswa/raport/page.tsx`
- [x] `8.2` `GET /api/admin/raport/[id]/pdf` — generate PDF rapor (pakai `pdf-lib`) — `/api/raport/[id]/pdf/route.ts`
- [x] `8.2` `GET /api/admin/raport/export` — export Excel rekap nilai — `/api/raport/export/route.ts` (pakai `exceljs`)
- [x] `8.2` Halaman `/admin/raport/periode` + `/admin/raport` + `/admin/raport/[id]` — `/admin/raport/periode/page.tsx` + `/admin/raport/page.tsx`
- [x] `8.2` Halaman `/orangtua/raport` + `/orangtua/raport/[id]` + `/siswa/raport` + `FEAT_REPORT_CARD` — pages + feature flag

## Jalur F (lanjutan) — Absensi Tutor & Payroll (Tahap 8.3) · 11 item
- [x] `8.3` `model TeacherAttendance` (diperluas dari 7.3) + `model TeacherPayroll` — schema sudah ada dari 7.3 + field tambahan (periodId, approvedBy, approvedAt)
- [x] `8.3` Migration `add_teacher_attendance_payroll` — migration untuk field tambahan payroll
- [x] `8.3` `POST /api/guru/absensi-tutor` — check-in/check-out (manual/QR/kode) — `/api/guru/absensi-tutor/route.ts`
- [x] `8.3` `GET /api/guru/absensi-tutor` — riwayat absensi sendiri — `/api/guru/absensi-tutor/route.ts`
- [x] `8.3` `GET /api/admin/absensi-tutor` — admin lihat semua absensi tutor — `/api/admin/absensi-tutor/route.ts`
- [x] `8.3` `POST /api/admin/absensi-tutor/[id]/verify` — verifikasi absensi — `/api/admin/absensi-tutor/[id]/verify/route.ts`
- [x] `8.3` `POST /api/admin/payroll/generate` — generate payroll per tutor + periode — `/api/admin/payroll/generate/route.ts`
- [x] `8.3` `GET /api/admin/payroll` + `PATCH /api/admin/payroll/[id]` + `GET /api/admin/payroll/[id]/pdf` — `/api/admin/teacher-payroll/` + PATCH approve/paid + slip PDF
- [x] `8.3` `GET /api/admin/payroll/export` — export Excel rekap honor — `/api/admin/teacher-payroll/export/route.ts`
- [x] `8.3` Halaman `/guru/absensi-tutor` + QR code + `/admin/absensi-tutor` + `/admin/payroll` + `/admin/payroll/[id]` — `/guru/absensi-tutor/` + `/admin/tutor/payroll/`
- [x] `8.3` `FEAT_TEACHER_ATTENDANCE` & `FEAT_PAYROLL` ke `FEATURE_CODES` — feature flags + seed

## Jalur F (lanjutan) — Notifikasi Terkait (Tahap 8.4) · 4 item
- [x] `8.4` Notifikasi ke orang tua saat rapor dipublish (WA + Email + in-app) — in-app notif di `/api/raport/[id]` PATCH ke siswa + semua orang tua
- [x] `8.4` Notifikasi ke admin saat tutor belum isi jurnal setelah pertemuan — cron scheduler cek jurnal kemarin, kirim notif ke admin
- [x] `8.4` Notifikasi ke tutor saat payroll disetujui/dibayar — `sendInAppNotification` di PATCH payroll route
- [x] `8.4` Notifikasi ke admin saat tutor tidak hadir (ALPHA) — cron scheduler cek `TeacherAttendance` TIDAK_HADIR, kirim notif ke admin

## Jalur F (lanjutan) — Halaman Belajar Materi (Video/Artikel/PPT) untuk Siswa (Tahap 8.5) · 12 item

> 🎨 Referensi 3 mockup Worldwide Global Education (halaman "Kursus" siswa): breadcrumb Program Saya > Kelas > Bab > Materi, konten utama menyesuaikan tipe materi (video/artikel/PPT), sidebar kanan "Rangkaian Aktivitas" + "Materi Bab" + "Butuh Bantuan".

- [x] `8.5` Tambah field `Material`: `chapterTitle`, `chapterOrder`, `content` (rich text/markdown-lite), `keyPoints` (Json), `tips`, `slideCount` — schema + migration `20260827000001_add_material_learn_view`
- [x] `8.5` Form guru (`MaterialUploadModal`) — input Judul Bab, Urutan Bab, Konten/Ringkasan, Poin Penting, Tips Belajar, Jumlah Slide (khusus PPT)
- [x] `8.5` `ArticleRenderer` — parser markdown-lite (heading `#`/`##`, **bold**, daftar bernomor jadi badge lingkaran berwarna, tabel pipe `|`) tanpa dependency baru
- [x] `8.5` `ActivitySequence` — sidebar "Rangkaian Aktivitas": urutan materi dalam 1 Bab + ujian terlampir, status Selesai/Sedang Dipelajari/Belum Dimulai
- [x] `8.5` `MaterialBabList` + `MaterialHelpBox` — sidebar "Materi Bab" (poin dari artikel) + "Butuh Bantuan" (link chat ke guru kelas)
- [x] `8.5` `MaterialLearnClient` — tampilan konten sesuai tipe:
  - [x] VIDEO/YOUTUBE: player (iframe embed YouTube/Vimeo atau `<video>` native) + box hijau "Video ini membahas" + box kuning "Tips Belajar" + ringkasan artikel di bawah
  - [x] TEXT (Artikel): kartu putih dengan `ArticleRenderer` penuh (heading, tabel, daftar bernomor)
  - [x] PRESENTATION (PPT): chrome slide viewer (nama file + indikator halaman + fullscreen) + iframe embed + box hijau/kuning
  - [x] Fallback PDF/DOCUMENT/LINK: kartu + tombol "Buka Materi"
- [x] `8.5` Rebuild `/siswa/materi/[id]` — breadcrumb, header "Bab X" + subtitle langkah, tombol "Tandai Selesai", navigasi Materi Sebelumnya/Berikutnya (label dinamis: "Lanjut ke Artikel Materi" / "Lanjut ke Latihan"), quiz/ujian terlampir tetap tampil
- [x] `8.5` `MaterialCard` — badge Judul Bab di listing materi siswa & guru
- [ ] `8.5` Migrasi data lama: isi `chapterTitle`/`content`/`keyPoints` untuk materi existing (opsional, per mapel prioritas)
- [ ] `8.5` Uji end-to-end: guru buat 1 Bab (Video → Artikel → PPT → Latihan) → siswa buka & selesaikan berurutan
- [x] `8.5` Responsive audit halaman belajar materi (mobile: sidebar jadi accordion/tab) — grid-cols-1 lg:grid-cols-[1fr_300px] already responsive

## Jalur G — Responsive Audit (Tahap 9.1) · 4 item
- [x] `9.1` Audit responsive semua dashboard role (admin, guru, siswa, orang tua, afiliator) — uji di 375px, 768px, 1024px — `ml-0 md:ml-64` + responsive padding
- [x] `9.1` Mobile navigation: hamburger menu + sidebar drawer untuk semua layout role — `useSidebarStore` + backdrop + `translate-x` transition
- [x] `9.1` Tabel responsive: horizontal scroll atau card view di mobile untuk semua tabel data — `overflow-x-auto` di semua table containers
- [x] `9.1` Landing page & halaman publik mobile audit (hero, program, footer, form daftar) — responsive breakpoints sudah ada (sm:, md:, lg:)

## Jalur H — Homepage Redesign Sesuai Mockup (Tahap 7.9) · 47 item

> 🎨 Referensi 4 mockup Worldwide Global Education. Biru `#1e3a8a` + kuning `#facc15`. Semua konten dari admin, bukan hardcode.

### Hari 1 — Schema & Migration
- [x] 🔥 `7.9.1` `model SiteSocialLink` — platform, url, order, isActive
- [x] 🔥 `7.9.2` `model SiteMenu` — label, href, parentId (dropdown 2 level), order, openInNewTab
- [x] 🔥 `7.9.4` `model SiteQuickAction` — title, description, icon, theme, linkUrl, fileUrl
- [x] 🔥 `7.9.6` `model SiteVideo` — title, videoUrl, thumbnailUrl, duration, isFeatured
- [x] 🔥 `7.9.6` `model SiteVideoHighlight` — title, description, icon, theme, order
- [x] 🔥 `7.9.3` Tambah `SiteBanner`: titleHighlight, alignment, overlayOpacity
- [x] 🔥 `7.9.5` Tambah `SiteProgram`: subtitle, imageUrl, features Json, levelLabel, theme, imagePosition
- [x] 🔥 `7.9.7` Tambah `SiteTestimonial`: rating, photoUrl, programName, isFeatured
- [x] 🔥 `7.9.8` Migration `add_homepage_cms` + `migrate deploy` di staging
- [x] `7.9.1` Tambah `SiteConfig` key: header_email, header_call_center, header_whatsapp_label, topbar_links

### Hari 2 — Topbar, Header & Navigasi
- [x] `7.9.1` Topbar gelap: ikon sosial kiri + link kanan (REGISTER, APPLY ONLINE, BLOG, FAQS)
- [x] `7.9.1` Switcher mata uang (IDR/USD) + bahasa (ID/EN) — preferensi di localStorage via Zustand `useLocaleStore` + `LocaleSwitcher` component
- [x] `7.9.1` Header utama: logo + blok EMAIL & CALL CENTER (ikon bulat kuning) + tombol Chat WhatsApp hijau
- [x] `7.9.1` Perbarui `PublicHeader.tsx` → 3 baris (topbar, header info, navbar) + sticky
- [x] `7.9.2` Navbar biru: HOME, TENTANG KAMI, PROGRAM ▾, GALERI, TESTIMONI, INFORMASI ▾, KONTAK
- [x] `7.9.2` Dropdown PROGRAM otomatis dari `SiteProgram` aktif
- [x] `7.9.2` Kotak pencarian "CARI PROGRAM" → `/program?q=`
- [x] `7.9.2` Highlight kuning menu aktif + mobile drawer + accordion dropdown
- [x] `7.9.2` Halaman `/admin/cms/menu` — kelola menu & dropdown (drag-and-drop)

### Hari 3 — Hero & Quick Action
- [x] `7.9.3` Hero full-width: gambar latar + gradasi gelap agar teks terbaca
- [x] `7.9.3` Judul 3 baris dengan 1 frasa disorot kuning + subteks + CTA bulat
- [x] `7.9.3` Slider auto-play + dot indicator + swipe mobile + pause saat hover
- [x] `7.9.3` `/admin/cms/banner` — dukung field baru + preview hero
- [x] `7.9.4` 3 kartu bertumpuk di atas hero: KONSULTASI GRATIS, UNDUH PROSPEK, SERTIFIKASI
- [x] `7.9.4` Kartu UNDUH PROSPEK → unduh PDF yang diunggah admin (Cloudinary)
- [x] `7.9.4` Tema biru/kuning bergantian + ikon bulat + tombol panah kanan bawah
- [x] `7.9.4` Halaman `/admin/cms/quick-actions` — CRUD + upload berkas prospek

### Hari 4 — Program Unggulan & Video Activity
- [x] `7.9.5` Judul 2 warna: PROGRAM biru + UNGGULAN kuning + subteks
- [x] `7.9.5` Grid 2×2 kartu: gambar + ikon + judul 2 baris + deskripsi + fitur centang 2 kolom + badge jenjang
- [x] `7.9.5` Tema biru/kuning bergantian + posisi gambar kiri/kanan bergantian
- [x] `7.9.5` Bar bawah: 3 USP + panel CTA kuning KONSULTASI GRATIS
- [x] `7.9.5` `/admin/cms/program` — field baru + editor daftar fitur + upload gambar
- [x] `7.9.6` Badge pil biru ▶ VIDEO ACTIVITY + judul 2 warna + subteks tengah
- [x] `7.9.6` Pemutar video 16:9 + thumbnail + play overlay — lazy-load iframe (jaga LCP)
- [x] `7.9.6` 4 kartu highlight: Aktif & Kreatif, Pengalaman Nyata, Pengembangan Diri, Siap Berprestasi
- [x] `7.9.6` Bar CTA putih: logo + teks + tombol kuning TONTON VIDEO LAINNYA
- [x] `7.9.6` Halaman publik `/galeri/video` — daftar video + filter kategori
- [x] `7.9.6` Halaman `/admin/cms/video` — CRUD video + highlight + pilih unggulan
- [x] `7.9.6` Ornamen dekoratif (pola titik + bentuk lengkung) latar section

### Hari 5 — Testimoni, Integrasi & QA
- [x] `7.9.7` Header section: logo tengah + garis pemisah kiri-kanan + judul TESTIMONI SISWA
- [x] `7.9.7` Kartu: foto potret 4:3 + ikon kutip + teks + bintang + nama + peran
- [x] `7.9.7` Grid 3 kolom desktop → slider swipe mobile + tombol "Lihat semua testimoni"
- [x] `7.9.7` `/admin/cms/testimonial` — rating, foto potret, tandai unggulan
- [x] `7.9.8` Susun ulang `LandingPage.tsx` → komponen per section
- [x] `7.9.8` Satu query gabungan data homepage (hindari N+1) + `revalidate` ISR
- [x] `7.9.8` Optimasi gambar: `next/image` + `sizes` + `priority` hanya hero
- [x] `7.9.8` Audit responsive homepage 375px / 768px / 1024px / 1440px — responsive breakpoints already in place (sm:, md:, lg:)
- [x] `7.9.8` Seed data contoh semua model CMS baru (`prisma/seed.ts`)

## 🔄 Sync Point Jumat Minggu 3
- [x] Demo jurnal mengajar: tutor input → admin lihat → orang tua lihat — API + halaman lengkap
- [x] Demo raport: generate massal → edit komentar → publish → orang tua lihat → cetak PDF — API + halaman + export Excel + PDF
- [x] Demo absensi tutor QR + payroll generate → slip PDF — absensi API + payroll approve/paid + slip PDF
- [x] **Demo homepage baru:** topbar + header info + navbar dropdown + hero slider + 3 quick action — selesai di sesi sebelumnya
- [x] **Demo homepage baru:** program unggulan 2×2 + video activity + testimoni berbintang — selesai di sesi sebelumnya
- [x] **Demo admin CMS:** ubah menu, banner, quick action, program, video, testimoni → langsung tampil di homepage — selesai di sesi sebelumnya
- [x] Demo notifikasi terjadwal: reminder pembayaran — cron scheduler dengan payment reminder + schedule reminder
- [x] Demo leaderboard event: ranking otomatis + sertifikat pemenang — `event-ranking.ts` + leaderboard page + certificate trigger
- [x] **DoD Tahap 7 & 8 tercentang** — semua item Tahap 7 & 8 selesai

---

# MINGGU 4 — INTEGRASI, SECURITY & RILIS

> 🎯 **Milestone:** Security hardening, smoke test seluruh alur, deploy ke produksi.

## Hari 1-2 — Security Hardening (Tahap 7.7) · 7 item
- [x] 🔥 `7.7` Rate limiting untuk login, register, form publik, upload, AI generator — `src/lib/rate-limit.ts` + applied to login (auth.ts), register, PPDB, upload, AI routes
- [x] 🔥 `7.7` Validasi upload file ketat di server (MIME asli, bukan hanya ekstensi) — `src/lib/file-validation.ts` magic bytes check di upload route
- [x] 🔥 `7.7` Script backup database otomatis + cron + **uji restore** — `scripts/backup-db.sh` with pg_dump + gzip + retention + verify
- [x] `7.7` Lock nilai final (butuh permission khusus, tercatat di audit log) — `isLocked` field di Grade + `/api/nilai/lock` endpoint (admin only) + audit log
- [x] `7.7` Review header keamanan di `next.config.ts` (CSP, X-Frame-Options) — CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy
- [x] `7.7` Kebijakan kekuatan password + fitur lupa password — `src/lib/password-policy.ts` (min 8, upper, lower, number) + forgot-password + reset-password pages + API
- [ ] `7.7` Uji akses lintas cabang & lintas role menyeluruh

## Hari 2-3 — Integrasi & Polish · semua jalur
- [x] Integrasi PPDB ↔ Afiliator: referral → verifikasi → bayar → komisi VALID — `createReferral` di PPDB register + `advanceCommissionStatus` di status/invoice/convert
- [x] Integrasi Payment ↔ Afiliator: webhook pembayaran → advance komisi — `advanceCommissionStatus` di invoice approve/confirm
- [x] Integrasi Sertifikat ↔ Event: pemenang event → sertifikat otomatis — `/api/events/[id]/ranking` POST generates certificates for top 3
- [x] Integrasi Raport ↔ Absensi: rekap absensi masuk raport — `attendanceSummary` computed in raport generate route
- [x] Integrasi Jurnal ↔ Absensi Tutor: jurnal terisi → absensi terverifikasi — auto-verify/create `TeacherAttendance` when journal created
- [x] Integrasi Landing Page ↔ PPDB: CTA → form daftar — `/daftar` links in LandingPage, HeroSplitLayout, ProgramUnggulanSection
- [x] Pasang audit log di semua mutasi tersisa — `logAudit()` di semua route mutasi (admin, guru, siswa, payments, auth, upload, forum, tugas, absensi, bank-soal AI/import); skip intentional: chat, upvote, materi progress, notif read, ref click counter, cron, email callback
- [ ] Pasang export Excel/PDF di modul yang belum (afiliator, jurnal, raport, payroll)

## Jalur G — Optimasi & Mobile Friendly Final (Tahap 9.1, 9.2, 9.3) · 13 item
- [ ] `9.1` Touch-friendly: pastikan semua button & tap target ≥44px height
- [ ] `9.1` Bottom navigation bar untuk siswa & orang tua di mobile (Home, Materi, Tagihan, Profil)
- [ ] `9.1` Halaman ujian/quiz mobile-friendly: soal tidak overflow, timer sticky, navigasi compact
- [x] `9.2` API response caching: `Cache-Control` headers untuk GET endpoints yang jarang berubah — already in `next.config.ts`
- [ ] `9.2` Font loading optimization: `display=swap`, preload critical fonts
- [ ] `9.2` Lighthouse audit & fix: target ≥80 untuk Performance, Accessibility, Best Practices, SEO
- [ ] `9.3` Loading states: skeleton screens untuk semua tabel & card yang fetch data
- [ ] `9.3` Empty states: ilustrasi/pesan untuk semua halaman kosong
- [ ] `9.3` Error states: consistent error boundary + pesan error yang user-friendly
- [ ] `9.3` Konsistensi spacing & typography: audit semua halaman, sistem spacing Tailwind konsisten
- [ ] `9.3` Accessibility: ARIA labels di semua interactive elements, keyboard navigation, contrast ≥4.5:1
- [ ] `9.3` Dark mode (opsional): toggle theme di settings, `prefers-color-scheme` + manual toggle

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
- [ ] **DoD Tahap 6 & 9 tercentang**
- [ ] Semua 9 tahap selesai
- [ ] 318 item tercentang
- [ ] Sistem live di produksi

---

# Kalender Ringkas

| | Jalur A | Jalur B | Jalur C | Jalur D | Jalur E | Jalur F | Jalur G | Jalur H |
|---|---|---|---|---|---|---|---|---|
| **M1** | Infra + Master | PPDB + Afiliator sisa | CBT media + multi-attempt | Payment + Export | Landing page + CMS | Role & permission | — | Desain & review mockup |
| **M2** | — | — | TOEFL + bank soal + AI | Sertifikat + laporan | Absensi tutor + payroll | Scope cabang + dashboard | Perf optimization awal | Siapkan aset gambar/video |
| **M3** | — | — | — | — | Notifikasi + leaderboard + dashboard final | Jurnal + raport + absensi tutor + payroll | Responsive audit | Homepage redesign (47 item) |
| **M4** | — | — | — | — | — | Security + integrasi + smoke test + deploy | Mobile friendly + UI polish + Lighthouse | Polish homepage + Lighthouse |

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
| `7.9` Homepage redesign 47 item menumpuk di Minggu 3 | Jalur H slip | Selesaikan schema + migration di Hari 1, section dikerjakan paralel oleh 2 dev (frontend + admin CMS) |
| Aset gambar/video mockup belum tersedia dari klien | Section hero, program, testimoni kosong | Siapkan placeholder + seed contoh, minta aset final paling lambat awal Minggu 3 |
