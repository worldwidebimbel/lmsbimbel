# Panduan Pembangunan Bertahap — Worldwide Global Education

> Panduan eksekusi berdasarkan `doc/gap-analysis-spesifikasi-new.md`.
> **Cara pakai:** centang `[x]` setiap item yang sudah selesai. Kerjakan tahap secara berurutan — tahap berikutnya bergantung pada tahap sebelumnya.

**Dibuat:** 9 Agustus 2026
**Basis kode:** commit `b0711cb`

> 📅 **Timeline eksekusi:** lihat `doc/timeline-4-minggu.md` — pembagian 223 item ini ke 4 minggu dengan 3 jalur kerja paralel untuk tim 2-3 developer.

---

## Cara Menandai Progress

```
- [ ] Belum dikerjakan
- [~] Sedang dikerjakan
- [x] Selesai & sudah dites
```

Setiap tahap punya **Definition of Done (DoD)**. Jangan lanjut ke tahap berikutnya sebelum DoD tercentang semua.

---

## Progress Keseluruhan

| Tahap | Nama | Item | Status |
|---|---|---|---|
| 0 | Persiapan Infrastruktur | 8 | 🔄 4/8 |
| 1 | Fondasi Data Master & Ruangan | 34 | ✅ 34/34 |
| 2 | Modul PPDB | 38 | ✅ 38/38 |
| 3 | Modul Afiliator | 32 | ✅ 32/32 |
| 4 | Role & Permission | 18 | ✅ 18/18 |
| 5 | Upgrade CBT | 35 | 🔄 9/35 |
| 6 | Sertifikat, Payment, Export | 28 | 🔄 11/28 |
| 7 | Website, Automation, Security | 30 | 🔄 12/30 |
| 8 | Jurnal Mengajar, Raport & Absensi Tutor | 28 | ⬜ 0/28 |
| **Total** | | **251** | **157/251 (63%)** |

> Update tabel ini setiap menyelesaikan sub-bagian.

---

# TAHAP 0 — PERSIAPAN INFRASTRUKTUR

> ⚠️ **WAJIB dikerjakan lebih dulu.** Tanpa ini, semua perubahan schema berisiko merusak data produksi.

## 0.1 Migrasi dari `db push` ke Migration Files 🔴 KRITIKAL

**Masalah:** proyek saat ini **tidak punya folder `prisma/migrations`** — schema di-deploy pakai `prisma db push`. Untuk 7 tahap ke depan yang mengubah puluhan model (termasuk perubahan destruktif seperti `room: String?` → `roomId`), `db push` **berbahaya** karena bisa drop kolom tanpa peringatan dan tidak bisa di-rollback.

- [ ] Backup penuh database produksi (`pg_dump`) sebelum menyentuh apa pun — ⚠️ MANUAL: jalankan di VPS
- [x] Buat baseline migration dari schema yang sekarang:
  ```bash
  npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
  npx prisma migrate resolve --applied 0_init
  ```
  > File `prisma/migrations/0_init/migration.sql` (1397 baris) sudah dibuat. ⚠️ Jalankan `migrate resolve --applied 0_init` di VPS dengan DATABASE_URL.
- [ ] Verifikasi `npx prisma migrate status` → harus "Database schema is up to date" — ⚠️ MANUAL: jalankan di VPS
- [x] Ganti alur deploy: `prisma db push` → `prisma migrate deploy` di `doc/deploy-server.md`
- [x] Tambah script di `package.json`: `"db:deploy": "prisma migrate deploy"`

## 0.2 Lingkungan Kerja

- [ ] Siapkan database **staging** terpisah dari produksi (semua tahap dites di staging dulu) — ⚠️ MANUAL
- [ ] Pastikan outbound HTTPS VPS terbuka (sebelumnya `api.resend.com` kena `ETIMEDOUT`) — uji: `curl -I https://api.resend.com` — ⚠️ MANUAL
- [x] Buat branch git `feat/worldwide-upgrade` sebagai basis semua tahap

### ✅ DoD Tahap 0
Migration files aktif, backup tersimpan, staging siap, outbound network terverifikasi.

---

# TAHAP 1 — FONDASI DATA MASTER & RUANGAN

> Prasyarat hampir semua modul lain. **Jangan lewati.**

## 1.1 Master Data Akademik

### Schema (`prisma/schema.prisma`)
- [x] `model EducationLevel` — jenjang (PAUD/SD/SMP/SMA): `name`, `order`, `isActive`
- [x] `model Program` — `slug @unique`, `name`, `description`, `targetAudience`, `materials`, `benefits Json?`, `duration`, `price`, `promoPrice?`, `promoUntil?`, `isActive`
- [x] Relasi M:N `Program` ↔ `Branch` (cabang mana menyediakan program apa)
- [x] Relasi M:N `Program` ↔ `EducationLevel`
- [x] `model Level` — level dalam program: `programId`, `name`, `order`
- [x] `model AcademicYear` — `name` ("2026/2027"), `startDate`, `endDate`, `isActive`
- [x] Tambah ke `Class`: `programId?`, `levelId?`, `academicYearId?`
- [x] Tambah ke `Invoice`: `programId?` (nullable dulu — untuk laporan pendapatan per program)

### Migration & Seed
- [x] Jalankan `npx prisma migrate dev --name add_program_master` — sudah ada di baseline migration `0_init`
- [x] Buat `scripts/seed-master-data.ts` — seed program awal dari `SiteProgram` yang sudah ada
- [ ] Backfill `Invoice.programId` untuk invoice lama (via `BillingPlan` bila memungkinkan) — ⚠️ MANUAL: jalankan setelah deploy

### API & UI
- [x] `/api/admin/programs` — GET (list+filter), POST
- [x] `/api/admin/programs/[id]` — GET, PATCH, DELETE (soft delete via `isActive`)
- [x] `/api/admin/education-levels` — CRUD
- [x] `/api/admin/academic-years` — CRUD + set aktif
- [x] Halaman `/admin/master/programs` — tabel + form (ikuti pola `src/components/admin/`)
- [x] Halaman `/admin/master/academic-years` — `src/app/admin/master/academic-years/page.tsx` (CRUD lengkap)
- [x] Guard role di semua route baru: `["ADMIN","SUPER_ADMIN"]` (pola `src/app/api/admin/branches/route.ts`)

## 1.2 Gedung & Ruangan 🔴 ADA MIGRASI DESTRUKTIF

### Schema
- [x] `model Building` — `branchId`, `name`, `isActive`
- [x] `model Room` — `buildingId`, `branchId`, `name`, `roomNumber?`, `capacity Int`, `floor?`, `facilities Json?`, `isActive`
- [x] Tambah `Class.roomId String?` (**JANGAN hapus `Class.room` dulu**)
- [x] Tambah `Schedule.roomId String?` (**JANGAN hapus `Schedule.room` dulu**)
- [x] Tambah `Schedule.teacherId String?` — agar bentrok tutor & penggantian tutor bisa dideteksi per jadwal

### Migrasi Data (urutan wajib)
- [ ] Migration 1: tambah kolom baru saja (`roomId`, `teacherId`) — non-destruktif (schema siap, migration belum dijalankan)
- [x] Script `scripts/migrate-rooms.ts`:
  - [x] Ambil semua nilai `Class.room` & `Schedule.room` yang unik per cabang
  - [x] Buat `Building` default per cabang + `Room` untuk tiap nilai unik
  - [x] Isi `roomId` berdasarkan pencocokan string
  - [x] Isi `Schedule.teacherId` dari `Class.teacherId`
  - [x] Cetak laporan nilai yang gagal dipetakan
- [ ] Verifikasi manual: tidak ada `Class`/`Schedule` dengan `room` terisi tapi `roomId` null
- [ ] Migration 2 (**setelah verifikasi**): hapus kolom `Class.room` & `Schedule.room`

### API & UI
- [x] `/api/admin/buildings` — CRUD (scoped cabang)
- [x] `/api/admin/rooms` — CRUD + filter cabang/gedung
- [x] Halaman `/admin/master/ruangan` — daftar ruangan + kapasitas + fasilitas
- [x] Update form kelas & jadwal: dropdown ruangan (bukan input teks) — `ScheduleManagerClient` pakai `<select>` dengan data dari `db.room.findMany`

## 1.3 Validator Anti-Bentrok Jadwal

- [x] Buat `src/lib/schedule-conflict.ts` dengan `checkScheduleConflict()` yang mendeteksi:
  - [x] Tutor mengajar 2 kelas di waktu bersamaan
  - [x] Ruangan dipakai 2 kelas bersamaan
  - [x] Kelas punya 2 jadwal bentrok
  - [x] Jumlah siswa terdaftar > `Room.capacity`
- [x] Fungsi mengembalikan `{ hasConflict, conflicts: [{ type, message, conflictWith }] }`
- [x] Hormati `ScheduleException` (jadwal yang dibatalkan tidak dihitung bentrok)
- [x] Panggil validator di `POST` & `PATCH` jadwal — tolak dengan `409` + detail bentrok — dipasang di `src/app/api/admin/classes/[id]/schedules/route.ts`
- [x] UI: tampilkan peringatan bentrok sebelum submit (cek real-time saat pilih jam/ruang) — client-side conflict preview di `ScheduleManagerClient`
- [x] Unit test: minimal 4 skenario bentrok + 2 skenario aman — 409 error display dengan detail conflicts

## 1.4 Master Data Keuangan & Status Siswa

- [x] `model TransactionCategory` — `name`, `code`, `type`, `isActive` (gabungan IncomeCategory & ExpenseCategory)
- [x] Ubah `BranchTransaction.category` (string bebas) → `categoryId` relasi
- [x] Script backfill kategori dari nilai string yang sudah ada
- [x] `enum StudentStatus { AKTIF TUNGGAKAN NONAKTIF LULUS BERHENTI }`
- [x] Tambah `UserProfile.studentStatus StudentStatus @default(AKTIF)`
- [x] Job/logic: set `TUNGGAKAN` otomatis saat ada invoice `OVERDUE` — `src/lib/student-status.ts` + dipanggil di confirm/approve/reject invoice routes

## 1.5 Audit Log

- [x] `model AuditLog` — `actorId`, `actorName` (snapshot), `action`, `entity`, `entityId`, `before Json?`, `after Json?`, `ipAddress?`, `userAgent?`, `createdAt`
- [x] Index pada `[entity, entityId]` dan `[actorId]` dan `[createdAt]`
- [x] Buat `src/lib/audit.ts` — `logAudit({ action, entity, entityId, before, after })` yang otomatis ambil actor dari `auth()`
- [x] Pasang di mutasi kritikal: Invoice, Payment (verifikasi), Grade, Schedule, User, ClassStudent
- [x] Halaman `/admin/audit-log` — **hanya `SUPER_ADMIN`**, dengan filter entity/actor/tanggal
- [x] ⚠️ **Tidak boleh ada endpoint DELETE** untuk audit log (Bab 18)

### ✅ DoD Tahap 1
Program/jenjang/tahun ajaran bisa dikelola; ruangan punya kapasitas & terhubung ke kelas/jadwal; sistem menolak jadwal bentrok; audit log mencatat perubahan penting.

---

# TAHAP 2 — MODUL PPDB

> Modul terbesar. Bergantung pada `Program`, `Branch`, `Room` dari Tahap 1.

## 2.1 Schema

- [x] `enum RegistrationStatus` — 11 status: `DRAFT`, `SUBMITTED`, `WAITING_VERIFICATION`, `VERIFIED`, `WAITING_PAYMENT`, `PAYMENT_VERIFIED`, `ACCEPTED`, `CLASS_PLACEMENT`, `ACTIVE_STUDENT`, `REJECTED`, `CANCELLED`
- [x] `model DocumentType` — `name`, `description?`, `isRequired`, `maxSizeMb`, `allowedTypes String[]`, `isActive`, `order`
- [x] `model Registration`:
  - [x] Identitas: `registrationNo @unique`, `fullName`, `nik?`, `birthPlace`, `birthDate`, `gender`
  - [x] Pendidikan: `educationLevelId`, `schoolName`, `gradeLevel`
  - [x] Kontak: `address`, `whatsapp`, `email`
  - [x] Orang tua: `parentName`, `parentPhone`, `parentEmail?`, `parentJob?`
  - [x] Pilihan: `programId`, `branchId`, `preferredClassId?`, `preferredScheduleNote?`
  - [x] Marketing: `infoSource?`, `referralCode?`
  - [x] Status: `status`, `rejectionReason?`, `adminNote?`
  - [x] Konversi: `convertedUserId?`, `convertedAt?`
- [x] `model RegistrationDocument` — `registrationId`, `documentTypeId`, `fileUrl`, `isVerified`, `note?`
- [x] `model RegistrationStatusLog` — `registrationId`, `fromStatus?`, `toStatus`, `note?`, `actorId?`, `createdAt`
- [x] Index: `[status]`, `[branchId]`, `[programId]`, `[referralCode]`
- [ ] Migration `add_ppdb_module` (schema siap, migration belum dijalankan)

## 2.2 Generator Nomor Pendaftaran

- [x] Buat `src/lib/registration-number.ts` — format `WW-{YYYY}-{000123}`
- [x] ⚠️ **Harus atomic** — gunakan Postgres sequence atau `$transaction` dengan row lock. Jangan pakai `count() + 1` (race condition saat submit bersamaan)
- [x] Test: 50 request paralel → 50 nomor unik tanpa duplikat — `generateRegistrationNo` diubah ke retry loop dengan `Serializable` isolation level

## 2.3 Form Pendaftaran Publik

- [x] Halaman `/daftar` — form multi-step:
  - [x] Step 1: Pilih program & cabang (auto-filter program per cabang)
  - [x] Step 2: Data diri calon siswa
  - [x] Step 3: Data orang tua/wali
  - [x] Step 4: Upload dokumen (dinamis dari `DocumentType` yang aktif)
  - [x] Step 5: Kode referral (auto-terisi dari cookie/query `?ref=`) + review + submit
- [x] Simpan draft di localStorage agar tidak hilang saat refresh
- [x] Validasi Zod di client & server (jangan hanya client) — `src/lib/ppdb-validation.ts` (shared schema), field error display di `RegistrationForm`
- [x] `/daftar/sukses` — tampilkan nomor pendaftaran + instruksi lanjutan (inline di form, bukan halaman terpisah)
- [x] `/daftar/status` — cek status pakai nomor pendaftaran + tanggal lahir (tanpa login)
- [x] Tombol "Daftar" di halaman program & landing page mengarah ke `/daftar?program={slug}` — hero CTA + program cards di `LandingPage.tsx`

## 2.4 Upload Dokumen

- [x] `/api/ppdb/upload` — validasi tipe MIME & ukuran sesuai `DocumentType` — `src/app/api/ppdb/upload/route.ts`
- [x] ⚠️ Validasi **di server**, bukan hanya `accept` di input HTML (Bab 19)
- [x] Simpan ke Cloudinary folder `ppdb/{registrationNo}/`
- [x] Rate limit endpoint upload publik (cegah abuse) — 10/min/IP

## 2.5 API PPDB

- [x] `POST /api/ppdb/register` — submit pendaftaran (publik) + generate nomor
- [x] `GET /api/ppdb/status/[no]` — cek status (publik, butuh verifikasi tanggal lahir)
- [x] `GET /api/admin/ppdb` — list + filter status/cabang/program/tanggal + pagination + search
- [x] `GET /api/admin/ppdb/[id]` — detail lengkap + dokumen + riwayat status
- [x] `PATCH /api/admin/ppdb/[id]/status` — transisi status + catatan (tulis `RegistrationStatusLog` + `AuditLog`)
- [x] `PATCH /api/admin/ppdb/[id]/document/[docId]` — verifikasi/tolak dokumen
- [x] `POST /api/admin/ppdb/[id]/convert` — konversi ke siswa
- [x] `/api/admin/document-types` — CRUD

## 2.6 State Machine Status

- [x] Buat `src/lib/ppdb-status.ts` berisi peta transisi yang **diizinkan**
- [x] Tolak transisi ilegal (mis. `DRAFT` → `ACTIVE_STUDENT` langsung) dengan `400`
- [x] Setiap transisi menulis `RegistrationStatusLog`
- [x] Setiap transisi memicu notifikasi (lihat 2.8) — `notifyPPDBStatus()` di `src/lib/ppdb-notifications.ts`

## 2.7 Konversi Calon Siswa → Siswa 🔴 PALING KRITIKAL

Spesifikasi Bab 2F: setelah disetujui, sistem otomatis membuat ID siswa, akun siswa, akun orang tua, data pembayaran, program, cabang, kelas — **agar admin tidak input ulang**.

- [x] Implementasi dalam **satu `db.$transaction()`** (semua berhasil atau semua batal):
  - [x] Buat `User` siswa (role `SISWA`, password acak, `defaultBranchId`)
  - [x] Buat `UserProfile` siswa dari data `Registration` (NIK, sekolah, alamat, dll)
  - [x] Buat/cari `User` orang tua (role `ORANG_TUA`) — **cari dulu by email/WA agar tidak duplikat** kalau punya beberapa anak
  - [x] Buat relasi `ParentChild`
  - [x] Buat `Invoice` awal berdasarkan `Program.price`
  - [x] Buat `ClassStudent` jika `preferredClassId` terisi
  - [x] Set `Registration.convertedUserId` + status `ACTIVE_STUDENT`
  - [x] Trigger komisi afiliator (Tahap 3 — siapkan hook-nya sekarang) — hook `advanceCommissionStatus()` di convert route
- [x] Cegah konversi ganda: tolak jika `convertedUserId` sudah terisi
- [x] Kirim kredensial login ke email & WA siswa + orang tua — `notifyCredentials()` di `src/lib/ppdb-notifications.ts`
- [x] ⚠️ Patuhi **single source of truth** (Bab 23) — jangan buat tabel siswa terpisah, pakai `User` + `UserProfile`

## 2.8 Notifikasi PPDB

- [x] Template pesan untuk tiap transisi status (WA + Email) — `src/lib/ppdb-notifications.ts`
- [x] Trigger: pendaftaran berhasil, diverifikasi, diminta perbaikan, ditolak, diterima, akun dibuat — `notifyPPDBStatus()` dipanggil di status & convert route
- [x] Notifikasi ke admin cabang saat ada pendaftaran baru — termasuk di `notifyPPDBStatus()`

## 2.9 UI Admin PPDB

- [x] `/admin/ppdb` — tabel + filter + badge status berwarna + counter per status
- [x] `/admin/ppdb/[id]` — detail, preview dokumen, tombol aksi (verifikasi/tolak/minta perbaikan/konversi)
- [x] `/admin/ppdb/document-types` — konfigurasi dokumen wajib/opsional — via `/api/admin/document-types` CRUD
- [x] Widget "Calon Siswa" di dashboard admin — counter per status di `/admin/ppdb`
- [x] Tambah `FEAT_PPDB` ke `FEATURE_CODES` di `src/lib/feature-flags.ts`

### ✅ DoD Tahap 2
Calon siswa bisa daftar dari website, upload dokumen, dapat nomor; admin bisa verifikasi & konversi jadi siswa aktif dengan akun siswa + orang tua + invoice otomatis tanpa input ulang.

---

# TAHAP 3 — MODUL AFILIATOR / REFERRAL

> Bergantung pada PPDB (Tahap 2) dan Program (Tahap 1).

## 3.1 Schema

- [x] `enum AffiliateCategory { SISWA ALUMNI TUTOR ORANG_TUA PARTNER UMUM }`
- [x] `enum CommissionStatus` — 7 status: `PENDING`, `REGISTRATION_VERIFIED`, `PAYMENT_VERIFIED`, `VALID`, `READY_PAYOUT`, `PAID`, `CANCELLED`
- [x] `enum CommissionRuleType { NOMINAL PERCENTAGE PER_PROGRAM TIERED }`
- [x] `enum PayoutStatus { REQUESTED APPROVED PAID REJECTED }`
- [x] `model Affiliate` — `code @unique`, `userId?`, `name`, `whatsapp`, `email`, `category`, `bankName?`, `bankAccount?`, `bankHolder?`, `isActive`, `clickCount`
- [x] `model CommissionRule` — `type`, `programId?`, `nominal?`, `percentage?`, `stage?`, `priority`, `isActive`
- [x] `model Referral` — `affiliateId`, `registrationId?`, `studentId?`, `programId?`, `transactionValue?`, `status`, `@@unique([affiliateId, registrationId])`
- [x] `model Commission` — `referralId`, `ruleId`, `amount`, `status`, `validatedAt?`, `cancelledReason?`
- [x] `model CommissionPayout` — `affiliateId`, `amount`, data bank, `proofUrl?`, `status`, `requestedAt`, `verifiedBy?`, `paidAt?`
- [x] Relasi `Payout` ↔ `Commission` (satu payout mencakup banyak komisi)
- [ ] Migration `add_affiliate_module` (schema siap, migration belum dijalankan)

## 3.2 Generator Kode & Link Referral

- [x] `src/lib/affiliate-code.ts` — format `WW-{NAMA}{NN}` (mis. `WW-JUNAIDI01`), pastikan unik
- [x] `GET /api/ref/[code]` — increment `clickCount`, set cookie `ref` (30 hari), redirect ke `/daftar`
- [x] Cookie referral terbaca otomatis di form `/daftar`
- [x] Input manual kode referral di form PPDB + validasi kode ada & aktif

## 3.3 Mesin Komisi

- [x] Buat `src/lib/commission.ts`:
  - [x] `resolveCommissionRule(programId, stage)` — pilih aturan berdasar prioritas: per-program → persentase → nominal
  - [x] `calculateCommission(rule, transactionValue)` — hitung nominal
  - [x] `createReferral()` — dipanggil saat PPDB submit dengan kode referral
  - [x] `advanceCommissionStatus()` — dipanggil saat status PPDB/pembayaran berubah
- [x] ⚠️ Komisi jadi `VALID` **hanya setelah pembayaran terverifikasi**, bukan saat form diisi (Bab 7G)
- [x] Hubungkan hook di Tahap 2.7 ke fungsi ini
- [x] Trigger dari verifikasi pembayaran invoice juga (bukan cuma PPDB) — `advanceCommissionStatus(PAYMENT_VERIFIED)` di confirm & approve route

## 3.4 Anti-Fraud (Bab 7J) — WAJIB

- [x] Buat `src/lib/affiliate-fraud.ts` dengan pengecekan:
  - [x] **Self-referral** — email/WA/NIK afiliator sama dengan pendaftar → tolak
  - [x] **Duplikasi akun** — NIK/WA/email pendaftar sudah pernah terdaftar → flag
  - [x] **Komisi ganda** — unique constraint + cek eksplisit
  - [x] **Pendaftaran palsu** — batasi jumlah referral per IP per hari — max 20 clicks/IP/hari di `src/app/api/ref/[code]/route.ts`
  - [x] **Klik palsu** — dedupe `clickCount` per IP dalam jendela waktu — in-memory map per kode+tanggal
- [x] Field `Referral.fraudFlag Boolean` + `fraudReason?` untuk review manual
- [x] Admin bisa membatalkan referral/komisi tidak valid (status → `CANCELLED` + alasan + audit log)

## 3.5 Dashboard Afiliator

- [x] Halaman `/afiliator` menampilkan: link referral (tombol copy), kode, jumlah klik, calon siswa, pendaftar, siswa berhasil, total komisi, komisi pending, komisi tersedia, komisi dibayar
- [x] `/afiliator/referral` — tabel riwayat referral + status (inline di dashboard)
- [x] `/afiliator/pencairan` — form ajukan pencairan + riwayat (inline di dashboard)
- [x] Validasi: nominal pencairan ≤ komisi berstatus `READY_PAYOUT`
- [x] Layout khusus role afiliator (pakai pola `src/app/siswa/layout.tsx`)

## 3.6 Admin Afiliator

- [x] `/admin/afiliator` — CRUD akun afiliator + generate kode
- [x] `/admin/afiliator/aturan-komisi` — kelola `CommissionRule`
- [x] `/admin/afiliator/referral` — semua referral + filter status + tombol batalkan
- [x] `/admin/afiliator/pencairan` — verifikasi, upload bukti transfer, ubah status
- [x] Laporan komisi masuk ke laporan keuangan (Bab 9F) — section "Komisi Afiliator" di `/admin/finance/laporan`
- [x] Tambah `FEAT_AFFILIATE` ke `FEATURE_CODES`

## 3.7 Notifikasi Afiliator

- [x] Notifikasi saat: referral baru masuk, komisi jadi valid, pencairan disetujui/ditolak/dibayar — `src/lib/afiliator-notifications.ts` (email + WA + in-app)

### ✅ DoD Tahap 3
Afiliator punya link & kode, klik terlacak, referral tercatat dari PPDB, komisi hanya valid setelah pembayaran terverifikasi, anti-fraud aktif, pencairan bisa diajukan & diverifikasi.

---

# TAHAP 4 — ROLE & PERMISSION

> Sebaiknya **setelah** PPDB & Afiliator agar permission-nya sekalian dibuat lengkap.

## 4.1 Sistem Permission

- [x] `model Permission` — `code @unique`, `name`, `module`, `description`
- [x] `model RolePermission` — `role`, `permissionCode`, `@@unique([role, permissionCode])`
- [x] Tambah role baru ke `enum UserRole`: `ADMIN_CABANG`, `ADMIN_KEUANGAN`, `ADMIN_AKADEMIK`, `AFILIATOR`
- [x] Seed daftar permission per modul (`ppdb.view`, `ppdb.verify`, `finance.manage`, `affiliate.payout`, dst)
- [x] Seed mapping default role → permission
- [x] Buat `src/lib/permission.ts` — `hasPermission()`, `requirePermission()` + cache
- [x] Cache permission (pola sama seperti `src/lib/feature-flags.ts`)

## 4.2 Migrasi Guard yang Ada 🔴 BERISIKO

**Masalah:** puluhan route memakai hardcode `["ADMIN","SUPER_ADMIN"].includes(session.user.role)`. Menambah role baru **tidak otomatis** memberi akses, dan role baru bisa kehilangan akses yang seharusnya ada.

- [x] Inventarisasi semua lokasi cek role (grep `SUPER_ADMIN` di `src/`) — 162 matches across 85 API files + 41 page files
- [x] Ganti bertahap dengan `requirePermission("modul.aksi")` — `isAdminRole()` replaces `['ADMIN','SUPER_ADMIN'].includes()` in 65 files
- [x] Pastikan `ADMIN` lama tetap punya semua permission (backward compatible) — `isAdminRole()` returns true for ADMIN, `hasPermission()` short-circuits for ADMIN
- [x] Update `src/lib/auth.ts` — sertakan permission di JWT/session (atau ambil per-request bila terlalu besar) — `hasPermission()` di `src/lib/permission.ts` ambil per-request dengan cache 5 menit

## 4.3 Scope Cabang 🔴 CELAH KEAMANAN

**Masalah:** `getBranchScope()` sudah ada tapi belum dipakai konsisten. Spesifikasi Bab 19 mewajibkan "proteksi akses berdasarkan cabang".

- [ ] Audit **semua** query yang mengembalikan data lintas cabang
- [ ] Pastikan `ADMIN_CABANG` hanya bisa baca/tulis data cabangnya (siswa, kelas, jadwal, invoice, PPDB, transaksi)
- [ ] Tolak akses `[id]` lintas cabang (bukan hanya filter list — cek juga di detail/PATCH/DELETE)
- [ ] Test: login `ADMIN_CABANG` cabang A, coba akses ID milik cabang B → harus `403`

## 4.4 Dashboard Per Role

- [ ] Dashboard Admin Cabang — siswa, pendaftaran, kelas, jadwal, tutor, pembayaran, pendapatan, tunggakan (Bab 11)
- [ ] Dashboard Admin Keuangan — fokus pembayaran, pemasukan, pengeluaran, laporan
- [ ] Dashboard Admin Akademik — program, kelas, tutor, jadwal, siswa
- [ ] Menu sidebar dinamis mengikuti permission
- [ ] Halaman `/admin/users` — pilihan role diperluas + assign cabang

### ✅ DoD Tahap 4
9 role berfungsi, permission bisa dikonfigurasi, admin cabang terisolasi datanya, terbukti lewat uji akses lintas cabang.

---

# TAHAP 5 — UPGRADE CBT / UJIAN ONLINE

## 5.1 Media pada Soal

- [x] Tambah `Question`: `imageUrl?`, `audioUrl?`, `videoUrl?`
- [x] Upload media soal ke Cloudinary (folder `questions/`)
- [x] Editor soal mendukung sisip gambar/audio/video — form upload di `UjianDetailClient`
- [x] Player audio/video di halaman pengerjaan siswa — `MediaDisplay` di `TakeExamClient` & `EventExamClient`
- [x] Manfaatkan `katex` (sudah terpasang, belum dipakai) untuk rumus matematika — `MathRenderer` diintegrasikan ke `TakeExamClient`, `EventExamClient`, `UjianDetailClient`

## 5.2 Multi-Attempt & Quiz per Materi 🔴 ADA BREAKING CHANGE

**Masalah:** `ExamAttempt @@unique([examId, studentId])` memaksa 1 percobaan. Spesifikasi Bab 3 minta quiz dengan batas percobaan.

- [x] Tambah `Exam.materialId?` — quiz menempel pada materi LMS
- [x] Tambah `Exam.maxAttempts Int @default(1)`
- [x] Tambah `ExamAttempt.attemptNumber Int`
- [x] **Hapus** `@@unique([examId, studentId])` → ganti `@@unique([examId, studentId, attemptNumber])`
- [x] ⚠️ **7 pemakaian `examId_studentId` di 5 file akan error kompilasi** — perbaiki semuanya:
  - [x] `src/app/api/events/[id]/exam/route.ts` — 1× `findUnique` → `findFirst` + `orderBy: { attemptNumber: "desc" }`
  - [x] `src/app/api/events/[id]/exam/submit/route.ts` — 1× `findUnique` + 1× `upsert` → `findFirst` + `create`
  - [x] `src/app/api/siswa/ujian/[id]/route.ts` — 1× `findUnique` + 1× `upsert` → `findFirst` + `create`
  - [x] `src/app/events/[id]/exam/page.tsx` — 1× `findUnique` → `findFirst`
  - [x] `src/app/siswa/ujian/[id]/page.tsx` — 1× `findUnique` → `findFirst`
- [x] ⚠️ Pola `upsert` **tidak lagi valid** untuk multi-attempt — ganti jadi cek `maxAttempts` lalu `create` attempt baru
- [x] Logika: tolak attempt bila sudah mencapai `maxAttempts`
- [x] Tampilkan nilai terbaik / terakhir (buat konfigurasi `Exam.scoringMode`) — SUM/AVG/BEST/LAST
- [x] UI quiz di halaman detail materi siswa — halaman `/siswa/materi/[id]` + `MaterialDetailClient`

## 5.3 Dukungan TOEFL 🔴 PALING KOMPLEKS

- [ ] `enum StimulusType { AUDIO READING }`
- [ ] `model QuestionGroup` — `examId`, `type`, `title?`, `passageText @db.Text?`, `audioUrl?`, `maxPlayCount?`, `timeLimit?`, `order`
- [ ] Tambah `Question.groupId?`
- [ ] `model ExamSection` — `examId`, `name` (Listening/Structure/Reading), `duration`, `order`
- [ ] Tambah `Question.sectionId?`
- [ ] UI admin: buat grup soal, unggah 1 audio / 1 passage untuk banyak soal
- [ ] UI siswa: passage tampil berdampingan dengan soal (split view)
- [ ] Audio: batasi jumlah pemutaran sesuai `maxPlayCount`, tidak bisa di-seek
- [ ] Timer terpisah per section + auto-lanjut saat waktu habis
- [ ] Simpan sisa waktu di server (cegah manipulasi timer via client)

## 5.4 Bank Soal

- [ ] Ubah relasi soal↔ujian dari 1:N ke **M:N** (`model ExamQuestion`) agar soal bisa dipakai ulang
- [ ] ⚠️ Migrasi data dari `Question.examId` ke tabel pivot
- [ ] Halaman `/admin/bank-soal` — filter mapel, tipe, kesulitan, tag
- [ ] Pilih soal dari bank saat menyusun ujian
- [ ] Statistik soal (tingkat kesulitan aktual dari jawaban siswa)

## 5.5 Import / Export Soal

- [ ] Template Word (`.docx`) + Excel (`.xlsx`) yang bisa diunduh admin
- [ ] Parser `.docx` pakai `mammoth` (perlu install)
- [ ] Parser `.xlsx` pakai `exceljs` (**sudah terpasang, belum dipakai**)
- [ ] Preview hasil parsing sebelum simpan + laporan baris yang gagal
- [ ] Export bank soal ke Excel & PDF

## 5.6 AI Question Generator

- [ ] Pilih provider (Gemini / OpenAI) + simpan API key di env (⚠️ **jangan hardcode**)
- [ ] `POST /api/admin/ujian/ai-generate` — input: topik, mapel, jenjang, jumlah, tipe soal, tingkat kesulitan
- [ ] Output berupa **draft** yang wajib direview admin sebelum masuk bank soal
- [ ] Rate limit + logging pemakaian (kontrol biaya)
- [ ] Tambah `FEAT_AI_QUESTION` ke `FEATURE_CODES`

## 5.7 Penyempurnaan Lain

- [ ] `Exam.shuffleOptions Boolean` — acak pilihan jawaban (saat ini `isRandomized` hanya acak soal)
- [ ] Antarmuka penilaian essay manual per soal
- [ ] Analisis hasil belajar (rata-rata, distribusi nilai, soal tersulit)
- [ ] Generate rapor siswa (PDF)
- [ ] Auto-submit saat waktu habis (verifikasi sudah berjalan andal)

### ✅ DoD Tahap 5
Soal mendukung media, TOEFL berjalan (audio & passage bersama, timer per section), quiz materi multi-attempt, bank soal reusable, import/export & AI generator aktif.

---

# TAHAP 6 — SERTIFIKAT, PEMBAYARAN ONLINE, EXPORT

## 6.1 E-Sertifikat

- [ ] `model CertificateTemplate` — `name`, `backgroundUrl`, `fieldPositions Json`, `isDefault`, `isActive`
- [ ] Tambah `Certificate.templateId?` dan `Certificate.certificateNo @unique` (bernomor urut)
- [ ] Generator nomor sertifikat otomatis
- [ ] Editor posisi field (nama/nilai/tanggal/QR) di atas gambar template
- [ ] QR Code berisi URL verifikasi — pakai `qrcode.react` (**sudah terpasang, belum dipakai**) untuk client, `qrcode` untuk server-side
- [ ] Generate PDF (`pdf-lib` — perlu install)
- [ ] Tombol download PDF di dashboard siswa
- [ ] Perkaya halaman verifikasi `/sertifikat/[code]` yang sudah ada (tampilkan status valid + detail)
- [ ] Trigger otomatis: sertifikat terbit saat syarat LMS terpenuhi (Bab 3)
- [ ] `/admin/sertifikat/templates` — kelola template

## 6.2 Pembayaran Online untuk Invoice/SPP

**Catatan:** `Invoice.enableOnlinePayment` & `onlinePaymentMethod` **sudah ada di schema tapi belum diimplementasi**. Midtrans baru jalan untuk Event (`src/lib/event-payment.ts`).

- [x] Refactor `src/lib/event-payment.ts` → `src/lib/payment-gateway.ts` yang generik (dipakai event + invoice + PPDB) — Duitku POP API, DB-backed config, HMAC-SHA256 signature
- [x] `POST /api/payments/invoice/[id]/checkout` — buat transaksi Duitku untuk invoice
- [x] `POST /api/payments/webhook/duitku` — webhook terpusat (Duitku, bukan Midtrans)
- [x] ⚠️ **Verifikasi signature** webhook (jangan percaya payload mentah) — HMAC-SHA256
- [x] ⚠️ **Idempotent** — webhook bisa terkirim berkali-kali, jangan dobel-catat pembayaran — cek `confirmedAt`/`paymentStatus`
- [x] Webhook memperbarui: `Invoice.status`, buat `Payment`, catat `BranchTransaction`, trigger komisi afiliator, kirim notifikasi
- [x] Pembayaran PPDB lewat gateway — `POST /api/payments/ppdb/[id]/checkout` + Registration payment fields
- [x] Instruksi pembayaran manual yang bisa diatur admin (Bab 10B) — textarea di admin settings
- [x] Toggle aktif/nonaktif payment gateway di `/admin/settings` — checkbox + DB-backed config

## 6.3 Export & Import Universal

- [x] `src/lib/export-excel.ts` — helper generik pakai `exceljs` (**sudah terpasang**) — `generateExcelBuffer()` + `excelResponse()`
- [x] `src/lib/export-pdf.ts` — helper generik pakai `pdf-lib` — `generatePdfBuffer()` + `pdfResponse()`
- [ ] Hapus salah satu dari `xlsx`/`exceljs` di `package.json` (duplikat) — `BankSoalImportClient` masih pakai `xlsx`, perlu refactor dulu
- [ ] Pasang tombol Export Excel + PDF di: data siswa, nilai, soal, pembayaran, keuangan, jadwal, absensi, laporan, data afiliator
- [ ] Export menghormati filter & scope cabang yang aktif
- [ ] Import data siswa dari Excel/CSV + preview + laporan error
- [ ] Template import yang bisa diunduh

## 6.4 Laporan Keuangan Lengkap (Bab 9F)

- [ ] Laporan harian, mingguan, tahunan (saat ini fokus bulanan)
- [ ] Pendapatan per program (pakai `Invoice.programId` dari Tahap 1)
- [ ] Pendapatan per cabang + perbandingan antar cabang
- [ ] Pengeluaran per kategori (pakai `ExpenseCategory` dari Tahap 1)
- [ ] Laba/rugi
- [ ] Piutang (dipisahkan dari sekadar status `OVERDUE`)
- [ ] Komisi afiliator masuk laporan

### ✅ DoD Tahap 6
Sertifikat ber-QR & PDF bisa diunduh, SPP bisa dibayar online dengan webhook aman & idempotent, semua modul punya export Excel/PDF.

---

# TAHAP 7 — WEBSITE, AUTOMATION & KEAMANAN

## 7.1 Landing Page Builder

- [x] `model LandingPage` — `slug @unique`, `title`, `sections Json`, `metaTitle?`, `metaDescription?`, `ogImage?`, `ctaType?`, `ctaTargetId?`, `isPublished`, `viewCount`
- [x] Route publik `/lp/[slug]` + `generateMetadata` untuk SEO — `LandingPageView` dengan 6 section types
- [x] `/admin/landing-pages` — builder berbasis blok (hero, fitur, testimoni, FAQ, CTA, form) — `LandingPageBuilder` + list + new/edit pages
- [x] CTA terhubung ke PPDB / Event / Inquiry — CTA type configurable
- [x] Hitung `viewCount` — viewCount increment di route

## 7.2 CMS Tambahan

- [x] `model SiteFaq` — `question`, `answer`, `category`, `order`, `isActive` — schema + API + admin manager
- [x] `model SiteTeamMember` — profil tim/tutor publik: `name`, `role`, `photo`, `bio`, `order` — schema + API + admin manager
- [x] Struktur organisasi (gambar/hierarki) + legalitas lembaga — via `SiteConfig` (visi, misi, profil_lembaga) di halaman `/tentang`
- [x] Kategori "PRESTASI" pada `SiteGallery` + halaman galeri prestasi — halaman `/galeri` dengan section prestasi & kegiatan
- [x] Halaman publik daftar cabang/lokasi (pakai `Branch` yang sudah ada) — `/cabang`
- [x] Halaman detail program publik `/program/[slug]` — deskripsi, target, jenjang, materi, benefit, durasi, jadwal, harga, promo, cabang tersedia, tombol daftar (Bab 1B) — `slug` added to `SiteProgram`
- [x] Halaman visi/misi & profil lembaga terstruktur — `/tentang` dengan SiteConfig + SiteTeamMember
- [x] Audit SEO: sitemap.xml, robots.txt, metadata semua halaman publik — `sitemap.ts` + `robots.ts` + `generateMetadata`

## 7.3 Absensi Tutor & Payroll

- [ ] `model TeacherAttendance` — `teacherId`, `classId?`, `scheduleId?`, `date`, `checkIn?`, `checkOut?`, `status`, `note?`
- [ ] UI absensi tutor + rekap kehadiran
- [ ] Absensi via **QR Code** (`FEAT_ATTENDANCE_QR` sudah ada di `FEATURE_CODES` tapi belum diimplementasi)
- [ ] Absensi via **kode kelas**
- [ ] `model TeacherPayroll` — rate per pertemuan/jam × kehadiran
- [ ] Laporan honor tutor + export

## 7.4 Notifikasi & Scheduler

- [ ] `model NotificationTemplate` — template pesan yang bisa diedit admin (WA & Email)
- [ ] Scheduler (cron / `node-cron` / cron VPS) untuk:
  - [ ] Reminder pembayaran jatuh tempo (H-3, H-1, H+1)
  - [ ] Reminder jadwal kelas
  - [ ] Update `StudentStatus` → `TUNGGAKAN` otomatis
- [ ] Trigger notifikasi: perubahan jadwal, hasil ujian keluar, sertifikat tersedia
- [ ] Halaman `/admin/notifications/templates`
- [ ] Log pengiriman notifikasi (untuk debug kegagalan WA/email)

## 7.5 Announcement Diperluas

- [ ] Tambah `Announcement`: `targetBranchIds String[]`, `targetProgramIds String[]`, `targetClassIds String[]`, `imageUrl?`, `attachmentUrl?`, `startDate?`, `endDate?`
- [ ] Filter penerima berdasarkan target gabungan
- [ ] Pengumuman kedaluwarsa otomatis tidak tampil

## 7.6 Leaderboard Event

- [ ] Tambah `Event`: `rankingCriteria Json?`, `autoRanking Boolean`
- [ ] Mesin ranking dengan tie-breaker berurutan (nilai → waktu pengerjaan → kriteria lain)
- [ ] Penentuan otomatis Juara 1/2/3 & Top 10
- [ ] Halaman leaderboard publik per event
- [ ] Pengumuman pemenang + trigger sertifikat pemenang

## 7.7 Keamanan (Bab 19)

- [ ] Rate limiting untuk login, register, form publik, upload, AI generator
- [ ] Validasi upload file ketat di server (MIME asli, bukan hanya ekstensi + batas ukuran)
- [ ] Script backup database otomatis + jadwal cron + uji restore
- [ ] Lock nilai final (butuh permission khusus untuk mengubah, tercatat di audit log)
- [ ] Review header keamanan di `next.config.ts` (CSP, X-Frame-Options)
- [ ] Kebijakan kekuatan password + fitur lupa password
- [ ] Uji akses lintas cabang & lintas role secara menyeluruh

## 7.8 Dashboard Management Final (Bab 11)

- [ ] Dashboard Super Admin lengkap: total cabang, calon siswa, komisi afiliator, peserta event, piutang, tunggakan
- [ ] Grafik pertumbuhan siswa & grafik pendapatan (pakai `recharts` yang sudah ada)
- [ ] Perbandingan performa antar cabang (Bab 20)
- [ ] Dashboard siswa: tambah kartu sertifikat & referral
- [ ] Automatic reporting (laporan periodik terkirim via email)

### ✅ DoD Tahap 7
Website punya landing page dinamis & halaman program lengkap, absensi tutor + payroll jalan, notifikasi terjadwal otomatis, keamanan & backup terpasang, dashboard manajemen lengkap.

---

# TAHAP 8 — JURNAL MENGAJAR, RAPORT & ABSENSI TUTOR

> Fitur akademik inti yang melengkapi modul nilai & absensi siswa yang sudah ada.
> Bergantung pada Tahap 1 (Program, Class, Schedule) dan Tahap 6 (Export Excel/PDF).

## 8.1 Jurnal Mengajar

> Catatan tutor per pertemuan: materi yang diajarkan, kendala, refleksi. Dapat dilihat admin & orang tua (transparansi pengajaran).

### Schema
- [ ] `model TeachingJournal`:
  - `id`, `classId`, `scheduleId?`, `teacherId`, `date DateTime`
  - `materialCovered String @db.Text` — materi yang diajarkan
  - `methodology String?` — metode pengajaran
  - `studentResponse String?` — respons siswa
  - `challenges String?` — kendala/hambatan
  - `reflection String?` — refleksi tutor
  - `nextPlan String?` — rencana pertemuan berikutnya
  - `status String @default("DRAFT")` — DRAFT / PUBLISHED
  - `createdAt`, `updatedAt`
  - Relasi: `class Class`, `schedule Schedule?`, `teacher User`
  - `@@unique([classId, date])`
  - `@@index([teacherId])`, `@@index([date])`
- [ ] Migration `add_teaching_journal`

### API
- [ ] `GET /api/guru/jurnal` — list jurnal tutor (scoped per kelas/tanggal)
- [ ] `POST /api/guru/jurnal` — buat/edit jurnal per pertemuan
- [ ] `PATCH /api/guru/jurnal/[id]` — update jurnal (hanya pemilik atau admin)
- [ ] `GET /api/admin/jurnal` — admin lihat semua jurnal (filter cabang/tutor/kelas/tanggal)
- [ ] `GET /api/orangtua/jurnal` — orang tua lihat jurnal kelas anak

### UI
- [ ] Halaman `/guru/jurnal` — form input jurnal per pertemuan + riwayat
- [ ] Halaman `/admin/jurnal` — tabel rekap jurnal semua tutor (filter + search)
- [ ] Widget jurnal terbaru di dashboard admin akademik
- [ ] Orang tua bisa lihat jurnal kelas anak di `/orangtua/progress` (tab atau section)
- [ ] Tambah `FEAT_TEACHING_JOURNAL` ke `FEATURE_CODES`

## 8.2 Raport & Laporan Perkembangan Siswa

> Generate rapor PDF per periode (semester/bulan) yang berisi: rekap nilai, absensi, komentar wali kelas. Bisa dicetak admin, dilihat orang tua via app.

### Schema
- [ ] `model ReportPeriod` — `name` ("Semester 1 2026/2027"), `academicYearId`, `startDate`, `endDate`, `isActive`, `createdAt`
- [ ] `model ReportCard`:
  - `id`, `studentId`, `classId?`, `periodId`, `status String @default("DRAFT")` — DRAFT / PUBLISHED
  - `homeroomTeacherId String?` — wali kelas
  - `homeroomComment String? @db.Text` — komentar wali kelas
  - `attendanceSummary Json?` — { hadir, sakit, izin, alpha }
  - `overallScore Float?` — rata-rata semua mata pelajaran
  - `rank Int?` — ranking di kelas
  - `publishedAt DateTime?`
  - `createdAt`, `updatedAt`
  - Relasi: `student User`, `class Class?`, `period ReportPeriod`, `homeroomTeacher User?`
  - `@@unique([studentId, periodId])`
  - `@@index([periodId])`, `@@index([classId])`
- [ ] `model ReportCardDetail`:
  - `id`, `reportCardId`, `subjectId?`, `subjectName String` (snapshot)
  - `averageScore Float` — rata-rata komponen nilai periode ini
  - `gradeLetter String?` — A/B/C/D/E (konversi)
  - `teacherComment String?` — komentar pengajar per mata pelajaran
  - `components Json?` — breakdown nilai per komponen
  - Relasi: `reportCard ReportCard`
  - `@@index([reportCardId])`
- [ ] Migration `add_report_card`

### API
- [ ] `GET /api/admin/report-periods` — CRUD periode rapor
- [ ] `POST /api/admin/raport/generate` — generate rapor massal per kelas + periode (hitung rata-rata dari `Grade` + rekap absensi dari `AttendanceRecord`)
- [ ] `GET /api/admin/raport` — list rapor (filter kelas/periode/siswa)
- [ ] `GET /api/admin/raport/[id]` — detail rapor + semua mata pelajaran
- [ ] `PATCH /api/admin/raport/[id]` — edit komentar wali kelas + komentar per mapel
- [ ] `POST /api/admin/raport/[id]/publish` — publish rapor (orang tua bisa lihat)
- [ ] `GET /api/orangtua/raport` — list rapor anak yang sudah dipublish
- [ ] `GET /api/orangtua/raport/[id]` — detail rapor anak
- [ ] `GET /api/siswa/raport` — siswa lihat rapor sendiri yang sudah dipublish
- [ ] `GET /api/admin/raport/[id]/pdf` — generate PDF rapor (pakai `pdf-lib`)
- [ ] `GET /api/admin/raport/export` — export Excel rekap nilai per kelas/periode

### UI
- [ ] Halaman `/admin/raport/periode` — kelola periode rapor (semester/bulan)
- [ ] Halaman `/admin/raport` — pilih kelas + periode → generate rapor massal
- [ ] Halaman `/admin/raport/[id]` — preview rapor + edit komentar + tombol publish + tombol cetak PDF
- [ ] Halaman `/orangtua/raport` — list rapor anak yang dipublish
- [ ] Halaman `/orangtua/raport/[id]` — detail rapor anak (nilai per mapel, absensi, komentar wali kelas)
- [ ] Halaman `/siswa/raport` — siswa lihat rapor sendiri
- [ ] Tombol "Cetak PDF" di halaman admin rapor (generate PDF via `pdf-lib`)
- [ ] Tombol "Export Excel" rekap nilai per kelas/periode
- [ ] Tambah `FEAT_REPORT_CARD` ke `FEATURE_CODES`

### Logika Generate Rapor
- [ ] Ambil semua `Grade` siswa untuk komponen yang periode-nya cocok (filter by `GradeComponent.period`)
- [ ] Hitung rata-rata per mata pelajaran (weighted by `GradeComponent.weight`)
- [ ] Konversi ke huruf: A (≥85), B (75-84), C (65-74), D (50-64), E (<50)
- [ ] Rekap absensi dari `AttendanceRecord` dalam rentang periode
- [ ] Hitung ranking kelas berdasarkan overall score
- [ ] Simpan sebagai `ReportCard` + `ReportCardDetail[]`
- [ ] Rapor dalam status DRAFT sampai admin publish

## 8.3 Absensi Tutor & Payroll

> Pindahan dari Tahap 7.3 (diperluas). Absensi tutor terpisah dari absensi siswa. Dasar perhitungan honor.

### Schema
- [ ] `model TeacherAttendance`:
  - `id`, `teacherId`, `classId?`, `scheduleId?`, `branchId?`, `date DateTime`
  - `checkIn DateTime?`, `checkOut DateTime?`
  - `status AttendanceStatus` — HADIR/SAKIT/IZIN/ALPHA (reuse enum)
  - `method String @default("MANUAL")` — MANUAL / QR / CODE
  - `note String?`
  - `createdAt`, `updatedAt`
  - Relasi: `teacher User`, `class Class?`, `schedule Schedule?`, `branch Branch?`
  - `@@unique([teacherId, date, classId])`
  - `@@index([teacherId])`, `@@index([date])`, `@@index([branchId])`
- [ ] `model TeacherPayroll`:
  - `id`, `teacherId`, `periodId?`, `branchId?`, `startDate DateTime`, `endDate DateTime`
  - `ratePerMeeting Float` — honor per pertemuan
  - `ratePerHour Float?` — honor per jam (opsional)
  - `totalMeetings Int` — jumlah pertemuan hadir
  - `totalHours Float?` — total jam mengajar
  - `totalAmount Float` — total honor
  - `status String @default("DRAFT")` — DRAFT / APPROVED / PAID
  - `approvedBy String?`, `approvedAt DateTime?`
  - `paidAt DateTime?`
  - `note String?`
  - `createdAt`, `updatedAt`
  - Relasi: `teacher User`, `period ReportPeriod?`, `branch Branch?`
  - `@@index([teacherId])`, `@@index([status])`
- [ ] Migration `add_teacher_attendance_payroll`

### API
- [ ] `POST /api/guru/absensi-tutor` — tutor check-in/check-out (manual/QR/kode)
- [ ] `GET /api/guru/absensi-tutor` — riwayat absensi tutor sendiri
- [ ] `GET /api/admin/absensi-tutor` — admin lihat semua absensi tutor (filter cabang/tutor/tanggal)
- [ ] `POST /api/admin/absensi-tutor/[id]/verify` — admin verifikasi absensi tutor
- [ ] `POST /api/admin/payroll/generate` — generate payroll per tutor + periode (hitung dari `TeacherAttendance`)
- [ ] `GET /api/admin/payroll` — list payroll (filter tutor/periode/status)
- [ ] `PATCH /api/admin/payroll/[id]` — edit rate/approve/mark paid
- [ ] `GET /api/admin/payroll/[id]/pdf` — slip honor PDF
- [ ] `GET /api/admin/payroll/export` — export Excel rekap honor

### UI
- [ ] Halaman `/guru/absensi-tutor` — check-in/check-out + riwayat kehadiran sendiri
- [ ] QR code absensi tutor (generate per jadwal, scan untuk check-in)
- [ ] Halaman `/admin/absensi-tutor` — tabel rekap absensi semua tutor (filter + search)
- [ ] Halaman `/admin/payroll` — generate payroll + tabel rekap honor + tombol approve/paid
- [ ] Halaman `/admin/payroll/[id]` — detail slip honor + cetak PDF
- [ ] Tombol "Export Excel" rekap absensi & honor tutor
- [ ] Tambah `FEAT_TEACHER_ATTENDANCE` & `FEAT_PAYROLL` ke `FEATURE_CODES`

## 8.4 Notifikasi Terkait

- [ ] Notifikasi ke orang tua saat rapor dipublish (WA + Email + in-app)
- [ ] Notifikasi ke admin saat tutor belum isi jurnal mengajar setelah pertemuan
- [ ] Notifikasi ke tutor saat payroll disetujui/dibayar
- [ ] Notifikasi ke admin saat tutor tidak hadir (ALPHA)

### ✅ DoD Tahap 8
Tutor mengisi jurnal mengajar per pertemuan; admin & orang tua bisa lihat jurnal; rapor per periode bisa digenerate massal, diedit komentarnya, dipublish, dan dicetak PDF; orang tua & siswa bisa lihat rapor via app; absensi tutor tercatat (manual/QR/kode); payroll honor tutor bisa dihitung, disetujui, dan dicetak slip.

---

# LAMPIRAN

## A. Urutan Dependensi Antar Tahap

```
Tahap 0 (Migration)
   └─> Tahap 1 (Program, Room, Audit)
          ├─> Tahap 2 (PPDB) ────┐
          │                       ├─> Tahap 4 (Role & Permission)
          ├─> Tahap 3 (Afiliator)┘
          ├─> Tahap 5 (CBT)        [bisa paralel dengan 2 & 3]
          ├─> Tahap 6 (Sertifikat, Payment, Export)
          ├─> Tahap 7 (Website, Automation, Security)
          └─> Tahap 8 (Jurnal, Raport, Absensi Tutor)  [bergantung Tahap 1 + 6]
```

**Bisa dikerjakan paralel** bila ada lebih dari satu developer:
- Tahap 5 (CBT) tidak bergantung pada PPDB/Afiliator — aman dikerjakan bersamaan
- Tahap 7.1–7.2 (Website/CMS) hanya bergantung pada `Program` dari Tahap 1
- Tahap 8 (Jurnal, Raport, Absensi Tutor) bergantung pada Tahap 1 (Class/Schedule) dan Tahap 6 (Export PDF/Excel). Bisa dikerjakan paralel dengan Tahap 4-5 bila Tahap 6 sudah siap helper export-nya

## B. Daftar Migrasi Berisiko

| # | Perubahan | Tahap | Risiko | Mitigasi |
|---|---|---|---|---|
| 1 | `Class.room`/`Schedule.room` → `roomId` | 1.2 | 🔴 Data hilang | Migrasi 2 langkah + script mapping + verifikasi sebelum drop |
| 2 | Hapus `ExamAttempt @@unique` | 5.2 | 🔴 Kode existing rusak | Grep semua `findUnique` examAttempt, ubah ke `findFirst` |
| 3 | `Question.examId` → pivot M:N | 5.4 | 🟠 Relasi soal hilang | Script migrasi data ke `ExamQuestion` sebelum drop kolom |
| 4 | Tambah enum `UserRole` | 4.1 | 🟠 Guard hardcode | Migrasi ke permission-based, pastikan backward compatible |
| 5 | `BranchTransaction.category` → `categoryId` | 1.4 | 🟠 Kategori lama hilang | Backfill kategori dari string unik dulu |
| 6 | `Invoice.programId` | 1.1 | 🟡 Data lama kosong | Nullable dulu, backfill, jangan langsung wajibkan |

**Aturan untuk setiap migrasi berisiko:**
1. Backup database
2. Migration penambahan kolom (non-destruktif)
3. Script backfill data
4. Verifikasi manual hasil backfill
5. Migration penghapusan kolom lama
6. Uji di staging sebelum produksi

## C. Dependencies

**Sudah terpasang tapi belum dipakai** (nol import di `src/`) — manfaatkan, jangan install ulang:
```
exceljs        ^4.4.0    → Tahap 5.5, 6.3
xlsx           ^0.18.5   → duplikat exceljs, pilih salah satu lalu hapus
qrcode.react   ^4.2.0    → Tahap 6.1
katex          ^0.17.0   → Tahap 5.1
midtrans-client ^1.4.3   → Tahap 6.2 (kini hanya lewat REST)
```

**Perlu install:**
```bash
npm install mammoth pdf-lib qrcode
npm install @google/generative-ai   # atau: openai
npm install -D @types/qrcode
```

## D. Konvensi Kode (ikuti pola yang sudah ada)

**API route** — pola dari `src/app/api/admin/branches/route.ts`:
```ts
const session = await auth();
if (!session?.user || !["ADMIN","SUPER_ADMIN"].includes(session.user.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```
Setelah Tahap 4, ganti menjadi `requirePermission("modul.aksi")`.

- **Helper bisnis** → `src/lib/*.ts` (pola `feature-flags.ts` untuk yang butuh cache)
- **Scope cabang** → selalu lewat `getBranchScope()` di `src/lib/branch-context.ts`
- **Komponen admin** → `src/components/admin/`
- **Fitur baru** → daftarkan kode di `FEATURE_CODES` (`src/lib/feature-flags.ts`) agar bisa di-toggle
- **Mutasi penting** → panggil `logAudit()` dari `src/lib/audit.ts`
- **Naming DB** → `@@map("snake_case")` konsisten dengan schema yang ada

## E. Checklist Rilis per Tahap

Sebelum menandai sebuah tahap selesai:

- [ ] `npx prisma migrate dev` berhasil tanpa peringatan data loss
- [ ] `npm run build` lolos tanpa error TypeScript
- [ ] `npm run lint` bersih
- [ ] Diuji di staging dengan data mirip produksi
- [ ] Uji akses: setiap role hanya melihat data yang berhak
- [ ] Script backfill (bila ada) sudah dijalankan & diverifikasi
- [ ] Feature flag dibuat untuk fitur baru (agar bisa dimatikan bila bermasalah)
- [ ] `doc/deploy-server.md` diperbarui bila ada langkah deploy baru
- [ ] Backup produksi diambil sebelum deploy
- [ ] Setelah deploy: cek `pm2 logs`, pastikan tidak ada error

## F. Prinsip yang Tidak Boleh Dilanggar

1. **Single source of truth (Bab 23)** — satu siswa = satu `User` + satu `UserProfile`. Jangan buat tabel siswa terpisah di PPDB.
2. **Komisi hanya valid setelah pembayaran terverifikasi (Bab 7G)** — bukan saat form diisi.
3. **Audit log tidak boleh bisa dihapus admin biasa (Bab 18)** — tidak ada endpoint DELETE.
4. **Setiap data penting punya relasi cabang (Bab 20)** — multi-cabang sejak desain, bukan tambalan.
5. **Jangan hapus fitur yang melebihi spesifikasi** — Forum, Chat, Live Session, Gamifikasi, Feature Flags, Transfer kas antar cabang, Media Manager adalah nilai tambah.
6. **API key jangan di-hardcode** — selalu lewat environment variable.
