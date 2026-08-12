# Gap Analysis — Spesifikasi Worldwide Global Education vs Sistem Saat Ini

> Dokumen ini membandingkan `doc/Spesifikasi Lengkap New.md` dengan implementasi aktual di repo (`prisma/schema.prisma` + `src/app`).
> Tujuan: memetakan **apa yang perlu dibenahi (upgrade)** dan **apa yang perlu dibuat baru**.

**Tanggal analisis:** 9 Agustus 2026
**Basis kode:** commit `b0711cb`

> 📋 **Panduan eksekusi:** lihat `doc/build-roadmap-checklist.md` — checklist bertahap 8 tahap (223 item) untuk mengerjakan seluruh temuan di dokumen ini.

---

## Ringkasan Eksekutif

Sistem saat ini adalah **LMS + CBT + Keuangan + Event + CMS** yang sudah cukup matang. Namun spesifikasi baru menuntut transformasi menjadi **Integrated Education Management System** dengan penambahan 3 modul besar yang **belum ada sama sekali**:

| # | Modul | Status | Bobot |
|---|-------|--------|-------|
| 1 | **PPDB / Penerimaan Siswa Baru** | ❌ Belum ada | 🔴 Sangat besar |
| 2 | **Afiliator / Referral + Komisi** | ❌ Belum ada | 🔴 Sangat besar |
| 3 | **Ruangan & Anti-Bentrok Jadwal** | ❌ Belum ada | 🟠 Besar |
| 4 | Program sebagai Master Data | ⚠️ Hanya CMS display | 🟠 Besar |
| 5 | Role granular (Admin Cabang/Keuangan/Akademik/Afiliator) | ⚠️ Hanya 5 role | 🟠 Besar |
| 6 | CBT: media soal, TOEFL, AI generator, import/export | ⚠️ Sebagian | 🟠 Besar |
| 7 | E-Sertifikat: template, QR, PDF | ⚠️ Sebagian | 🟡 Sedang |
| 8 | Audit Log | ❌ Belum ada | 🟡 Sedang |
| 9 | Absensi Tutor + Payroll | ❌ Belum ada | 🟡 Sedang |
| 10 | Export Excel/PDF universal | ❌ Belum ada | 🟡 Sedang |
| 11 | Jurnal Mengajar | ❌ Belum ada | 🟡 Sedang |
| 12 | Raport + Cetak PDF | ⚠️ Input nilai ada, generate/cetak belum | 🟡 Sedang |

**Estimasi:** ±60% fondasi sudah ada, ±40% pekerjaan baru (didominasi PPDB & Afiliator).

---

## BAGIAN A — YANG SUDAH ADA (Tidak perlu dibuat ulang)

Agar tidak terjadi duplikasi kerja, berikut yang **sudah terimplementasi** dan hanya perlu penyesuaian minor:

### Sudah lengkap
- **Auth & Session** — NextAuth v5, JWT, password hashing, Google OAuth
- **Multi-cabang dasar** — model `Branch`, `User.defaultBranchId`, `branch-context.ts`, transaksi & transfer kas antar cabang
- **LMS Materi** — `Material` (7 tipe: PDF/VIDEO/YOUTUBE/PRESENTATION/DOCUMENT/LINK/TEXT) + `MaterialProgress`
- **Tugas** — `Assignment` + `Submission` + penilaian
- **CBT dasar** — `Exam`, `Question` (8 tipe soal), `ExamAttempt`, timer, randomize, passing score
- **Absensi Siswa** — `Attendance` + `AttendanceRecord` (HADIR/SAKIT/IZIN/ALPHA)
- **Nilai** — `GradeComponent` (berbobot) + `Grade`
- **Keuangan** — `BillingPlan` (PERIOD & MEETING_PACKAGE), `Invoice`, `Payment`, laporan, overdue/tunggakan
- **Keuangan Cabang** — `BranchTransaction` (INCOME/EXPENSE/TRANSFER), `BranchCashTransfer` dengan approval
- **Event Berbayar** — `Event`, `EventPackage`, `EventRegistration` (+score, +rank, +paymentProof), Midtrans/Xendit
- **Notifikasi** — `Notification` in-app, `Announcement`, Email (Resend/OAuth2/SMTP), WhatsApp gateway
- **CMS Website** — `SiteConfig`, `SiteBanner`, `SiteGallery`, `SiteProgram`, `SiteTestimonial`, `BlogPost`, `SiteInquiry`
- **Sertifikat dasar** — `Certificate` + halaman publik `/sertifikat/[code]`
- **Media Manager** — `MediaFile` + Cloudinary
- **Feature Flags** — `FeatureFlag` + `FeatureFlagLog` untuk toggle modul
- **Kalender Akademik** — `AcademicCalendar`
- **Bonus (di luar spec)** — Forum diskusi, Chat/Message, Live Session, Gamifikasi (Badge/Points)

---

## BAGIAN B — YANG PERLU DIBUAT BARU

### B1. MODUL PPDB (Penerimaan Siswa Baru) — 🔴 PRIORITAS TERTINGGI

**Status: 0% — tidak ada satu pun model/route terkait.**

Spesifikasi Bab 2 menuntut alur lengkap: pendaftaran online → upload dokumen → nomor pendaftaran → verifikasi → pembayaran → konversi otomatis jadi siswa.

#### Model Prisma baru yang dibutuhkan

```
enum RegistrationStatus {
  DRAFT
  SUBMITTED              // Pendaftaran masuk
  WAITING_VERIFICATION   // Menunggu verifikasi
  VERIFIED               // Terverifikasi
  WAITING_PAYMENT        // Menunggu pembayaran
  PAYMENT_VERIFIED       // Pembayaran diverifikasi
  ACCEPTED               // Diterima
  CLASS_PLACEMENT        // Penempatan kelas
  ACTIVE_STUDENT         // Aktif sebagai siswa
  REJECTED
  CANCELLED
}

model Registration {
  registrationNo   String  @unique   // format WW-2026-000123
  // data diri: nama, nik, birthPlace, birthDate, gender, jenjang,
  //            schoolName, gradeLevel, address, whatsapp, email
  // data orang tua/wali
  programId        String
  branchId         String
  preferredClassId String?
  infoSource       String?           // sumber informasi
  referralCode     String?           // ← integrasi Afiliator
  status           RegistrationStatus
  convertedUserId  String?           // hasil konversi ke User
  ...
}

model RegistrationDocument {
  registrationId String
  documentTypeId String
  fileUrl        String
  isVerified     Boolean
  note           String?
}

model DocumentType {          // admin bisa atur dokumen apa saja yang wajib
  name       String
  isRequired Boolean
  isActive   Boolean
}

model RegistrationStatusLog {  // riwayat perubahan status + catatan admin
  registrationId String
  fromStatus     RegistrationStatus?
  toStatus       RegistrationStatus
  note           String?
  actorId        String
}
```

#### Route/halaman baru
| Path | Fungsi |
|---|---|
| `/daftar` (publik) | Form PPDB multi-step + upload dokumen + input kode referral |
| `/daftar/status/[no]` | Cek status pendaftaran oleh calon siswa |
| `/admin/ppdb` | Daftar pendaftar + filter status/cabang/program |
| `/admin/ppdb/[id]` | Detail, verifikasi dokumen, approve/reject, catatan |
| `/admin/ppdb/document-types` | Konfigurasi jenis dokumen wajib/opsional |
| `/api/ppdb/*` | Submit, upload, status transition, konversi ke siswa |

#### Logika kritikal
- **Generator nomor pendaftaran** — `WW-{tahun}-{urut 6 digit}`, atomic (hindari race condition)
- **Konversi otomatis** (Bab 2F) — 1 transaksi Prisma yang membuat: `User` (siswa) + `User` (orang tua) + `UserProfile` + `ParentChild` + `Invoice` awal + `ClassStudent` — supaya admin tidak input ulang
- **Trigger komisi afiliator** saat status → `PAYMENT_VERIFIED`

---

### B2. MODUL AFILIATOR / REFERRAL — 🔴 PRIORITAS TERTINGGI

**Status: 0% — tidak ada model/route terkait.**

#### Model Prisma baru

```
enum AffiliateCategory { SISWA ALUMNI TUTOR ORANG_TUA PARTNER UMUM }

enum CommissionStatus {
  PENDING
  REGISTRATION_VERIFIED
  PAYMENT_VERIFIED
  VALID
  READY_PAYOUT
  PAID
  CANCELLED
}

enum CommissionRuleType { NOMINAL PERCENTAGE PER_PROGRAM TIERED }

model Affiliate {
  code        String @unique   // WW-JUNAIDI01
  userId      String?          // opsional, bisa non-user
  name, whatsapp, email, bankName, bankAccount, bankHolder
  category    AffiliateCategory
  isActive    Boolean
  clickCount  Int              // tracking jumlah klik link
}

model CommissionRule {
  type          CommissionRuleType
  programId     String?          // komisi per program
  nominal       Float?
  percentage    Float?
  stage         String?          // pendaftaran / bayar-pertama / bayar-berikutnya
  isActive      Boolean
}

model Referral {
  affiliateId    String
  registrationId String?
  studentId      String?
  programId      String?
  transactionValue Float?
  status         CommissionStatus
  ...
}

model Commission {
  referralId String
  amount     Float
  status     CommissionStatus
  ruleId     String
}

model CommissionPayout {
  affiliateId String
  amount      Float
  bankName, bankAccount, bankHolder
  proofUrl    String?
  status      String   // REQUESTED / APPROVED / PAID / REJECTED
  verifiedBy  String?
}
```

#### Route/halaman baru
| Path | Fungsi |
|---|---|
| `/afiliator` | Dashboard afiliator: link, kode, klik, referral, komisi |
| `/afiliator/pencairan` | Ajukan pencairan + riwayat |
| `/admin/afiliator` | Kelola akun afiliator |
| `/admin/afiliator/aturan-komisi` | Konfigurasi `CommissionRule` |
| `/admin/afiliator/pencairan` | Verifikasi pencairan komisi |
| `/api/ref/[code]` | Redirect + increment `clickCount` + set cookie |

#### Anti-Fraud (Bab 7J) — wajib
- Blokir **self-referral** (email/WA/NIK afiliator == pendaftar)
- Deteksi duplikasi akun (NIK/WA/email sama)
- Komisi hanya valid setelah **pembayaran terverifikasi**, bukan saat form diisi
- Cegah komisi ganda (unique constraint `[affiliateId, registrationId]`)
- Admin dapat membatalkan referral/komisi

---

### B3. RUANGAN, GEDUNG & ANTI-BENTROK JADWAL — 🟠 BESAR

**Status: sangat lemah.** Saat ini:
```prisma
model Class    { room String? }   // ← teks bebas
model Schedule { room String? }   // ← teks bebas
```
Tidak ada kapasitas, lantai, fasilitas, maupun deteksi bentrok.

#### Model Prisma baru
```
model Building {
  branchId String
  name     String
  isActive Boolean
}

model Room {
  buildingId String
  branchId   String
  name       String     // "Ruang 01"
  roomNumber String?
  capacity   Int
  floor      String?
  facilities Json?      // AC, proyektor, whiteboard, dll
  isActive   Boolean
}
```

#### Perubahan model existing
- `Class.room: String?` → `Class.roomId: String?` (relasi ke `Room`)
- `Schedule.room: String?` → `Schedule.roomId: String?`
- Tambah `Schedule.teacherId` (agar bisa deteksi bentrok tutor & penggantian tutor per jadwal)

#### Logika baru: validator bentrok (Bab 6E)
Helper `src/lib/schedule-conflict.ts` yang memvalidasi sebelum simpan:
1. Tutor mengajar 2 kelas di waktu bersamaan
2. Ruangan dipakai 2 kelas bersamaan
3. Kelas punya 2 jadwal bentrok
4. Jumlah siswa > kapasitas ruangan

#### Fitur turunan
- **Kalender jadwal** harian/mingguan/bulanan + filter cabang/program/tutor/ruangan/kelas (Bab 6F)
- **Reschedule & riwayat perubahan** — `ScheduleException` sudah ada, perlu diperluas: `newRoomId`, `substituteTeacherId`, `changeType`, `changedBy`

---

### B4. PROGRAM SEBAGAI MASTER DATA — 🟠 BESAR

**Status: hanya display.** `SiteProgram` cuma untuk tampilan website (title/icon/color). `Subject` adalah mata pelajaran, bukan program komersial.

Spesifikasi menuntut Program menjadi entitas inti yang direferensikan PPDB, harga, komisi, kelas, dan laporan.

#### Model Prisma baru
```
model Program {
  slug         String @unique
  name         String       // Bimbel Reguler, English Mastery, Calistung...
  description  String?
  targetAudience String?
  educationLevelIds String[] // jenjang
  materials    String?      // materi yang dipelajari
  benefits     Json?
  duration     String?
  price        Float
  promoPrice   Float?
  promoUntil   DateTime?
  isActive     Boolean
  branches     Branch[]     // cabang mana yang menyediakan
}

model EducationLevel {   // Jenjang: PAUD/SD/SMP/SMA
  name String
  order Int
}

model Level {            // Level dalam program: Beginner/Grade 5/dst
  programId String
  name      String
}

model AcademicYear {     // Tahun ajaran + periode
  name      String       // "2026/2027"
  startDate DateTime
  endDate   DateTime
  isActive  Boolean
}
```

#### Relasi yang perlu ditambahkan
- `Class.programId`, `Class.levelId`, `Class.academicYearId`
- `Registration.programId`
- `Invoice.programId` (untuk laporan pendapatan per program — Bab 9F)
- `CommissionRule.programId`

---

### B5. AUDIT LOG — 🟡 SEDANG

**Status: 0%.** Hanya ada `FeatureFlagLog` (khusus feature flag).

Spesifikasi Bab 18 mewajibkan pencatatan: siapa mengubah data siswa, pembayaran, jadwal, nilai, verifikasi pembayaran, pencairan komisi, penghapusan data.

```
model AuditLog {
  actorId    String
  actorName  String       // snapshot, tahan hapus user
  action     String       // CREATE / UPDATE / DELETE / VERIFY / APPROVE
  entity     String       // "Invoice", "Grade", "Schedule"
  entityId   String
  before     Json?
  after      Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime
}
```
**Catatan penting:** "Data audit log tidak boleh mudah dihapus oleh admin biasa" → hanya `SUPER_ADMIN` boleh melihat, **tidak ada endpoint delete**.

Implementasi disarankan lewat helper `src/lib/audit.ts` yang dipanggil dari API route mutasi penting.

---

### B6. ABSENSI TUTOR & PAYROLL — 🟡 SEDANG

**Status: absensi tutor 0%.** Yang ada hanya absensi siswa.

```
model TeacherAttendance {
  teacherId  String
  classId    String?
  scheduleId String?
  date       DateTime
  checkIn    DateTime?
  checkOut   DateTime?
  status     AttendanceStatus
  note       String?
}
```
Digunakan sebagai dasar perhitungan honor (Bab 16). Opsional lanjutan: `TeacherPayroll` (rate per pertemuan/jam × kehadiran).

Metode absensi tambahan yang diminta: **QR Code** dan **kode kelas** (saat ini hanya manual).

---

### B7. LANDING PAGE BUILDER — 🟡 SEDANG

**Status: 0%.** Spesifikasi Bab 1D: admin dapat membuat landing page khusus untuk PPDB, Olimpiade, Try Out, Holiday Program, Promo, Seminar, Webinar.

```
model LandingPage {
  slug        String @unique
  title       String
  sections    Json      // block-based content
  metaTitle, metaDescription, ogImage   // SEO
  ctaType     String?   // "ppdb" | "event" | "inquiry"
  ctaTargetId String?
  isPublished Boolean
  viewCount   Int
}
```
Route: `/lp/[slug]` (publik) + `/admin/landing-pages` (builder).

---

### B8. CMS TAMBAHAN — 🟡 SEDANG

Yang diminta spesifikasi tapi belum ada model-nya:

| Kebutuhan (Bab 1A & 1C) | Status |
|---|---|
| Visi & Misi, Profil Lembaga, Legalitas | ⚠️ Bisa pakai `SiteConfig`, tapi tidak terstruktur |
| Struktur Organisasi | ❌ Belum ada |
| Tim / Tutor (profil publik) | ❌ Belum ada → butuh `SiteTeamMember` |
| Cabang/Lokasi (halaman publik) | ⚠️ `Branch` ada, belum ditampilkan di website |
| **FAQ** | ❌ Belum ada → butuh `SiteFaq` |
| **Galeri Prestasi** | ⚠️ `SiteGallery.category` bisa dipakai, perlu kategori khusus |
| Berita & Artikel | ✅ `BlogPost` |
| Promo | ⚠️ Ada di `Program.promoPrice`, belum ada model `Promo` terpisah |

---

## BAGIAN C — YANG PERLU DIBENAHI (UPGRADE)

### C1. ROLE & HAK AKSES — 🟠 BESAR

**Saat ini:**
```prisma
enum UserRole { SUPER_ADMIN  ADMIN  GURU  SISWA  ORANG_TUA }
```

**Spesifikasi Bab 14 menuntut 9 role:**
| Role Spesifikasi | Status |
|---|---|
| Super Admin | ✅ `SUPER_ADMIN` |
| Admin Pusat | ⚠️ pakai `ADMIN` |
| **Admin Cabang** | ❌ Belum ada |
| **Admin Keuangan** | ❌ Belum ada |
| **Admin Akademik** | ❌ Belum ada |
| Tutor | ✅ `GURU` |
| Siswa | ✅ `SISWA` |
| Orang Tua | ✅ `ORANG_TUA` |
| **Afiliator** | ❌ Belum ada |

**Rekomendasi:** daripada terus menambah enum, migrasi ke **permission-based**:
```
model Permission     { code String @unique, name, module }
model RolePermission { role UserRole, permissionCode String }
```
Sehingga "Admin Keuangan" = `ADMIN` + set permission keuangan saja. Lebih scalable dan sesuai kalimat spesifikasi *"Admin cabang hanya dapat melihat data sesuai kewenangannya"*.

**Wajib juga:** enforcement **scope cabang** di setiap query — saat ini `branch-context.ts` sudah ada tapi perlu audit menyeluruh agar Admin Cabang tidak bisa membaca data cabang lain (Bab 19: *"Proteksi akses berdasarkan cabang"*).

---

### C2. CBT / UJIAN ONLINE — 🟠 BESAR

Tipe soal sudah bagus (8 tipe, melebihi spesifikasi). Yang kurang:

#### a) Media pada soal (Bab 4 "Media Soal") — ❌
`Question` saat ini hanya punya `content` (teks). Perlu:
```prisma
model Question {
  imageUrl String?
  audioUrl String?
  videoUrl String?
}
```

#### b) Dukungan TOEFL (Bab 4 "TOEFL") — ❌ paling kompleks
Butuh **stimulus bersama** — 1 audio / 1 reading passage untuk beberapa soal:
```
enum StimulusType { AUDIO READING }

model QuestionGroup {
  examId       String
  type         StimulusType
  title        String?
  passageText  String?       @db.Text
  audioUrl     String?
  maxPlayCount Int?          // batas pemutaran audio
  timeLimit    Int?          // waktu khusus per section
  order        Int
}
// Question.groupId String?
```
Plus konsep **section** (Listening / Structure / Reading) dengan timer terpisah.

#### c) AI Question Generator (Bab 4) — ❌
Belum ada. Perlu integrasi LLM (OpenAI/Gemini) + endpoint `/api/admin/ujian/ai-generate` yang menerima topik/materi/jumlah/tingkat kesulitan dan mengembalikan draft soal untuk direview admin.

#### d) Import/Export soal + template Word/Excel (Bab 4) — ❌
Belum ada. Perlu parser `.docx` (mammoth) & `.xlsx` (xlsx/exceljs) + template unduhan.

#### e) Quiz per materi (Bab 3 "Quiz") — ❌
`Exam` hanya bisa terhubung ke `classId` atau `eventId`. Spesifikasi LMS meminta **quiz per materi** dengan batas percobaan:
```prisma
model Exam {
  materialId  String?   // ← tambah
  maxAttempts Int  @default(1)  // ← tambah, saat ini @@unique([examId, studentId]) memaksa 1x
}
```
⚠️ Constraint `ExamAttempt @@unique([examId, studentId])` **harus dilonggarkan** agar multi-attempt mungkin.

#### f) Bank soal & pengelompokan — ⚠️
`Question.subjectId` + `tags` sudah ada, tapi belum ada UI bank soal terpusat dan reusability soal ke banyak ujian (saat ini `examId` 1:N, bukan M:N).

#### g) Random jawaban — ⚠️
`Exam.isRandomized` hanya mengacak soal. Perlu `shuffleOptions Boolean` untuk mengacak pilihan jawaban.

#### h) Penilaian essay manual & Rapor — ⚠️
`ExamAttempt.answers` Json ada, tapi belum ada alur grading essay per soal + generate rapor.

---

### C3. E-SERTIFIKAT — 🟡 SEDANG

**Sudah ada:** model `Certificate` (code unik, tipe, nama, nilai, rank) + halaman verifikasi publik `/sertifikat/[code]`.

**Yang kurang (Bab 8):**
| Fitur | Status |
|---|---|
| Template sertifikat | ❌ Belum ada model `CertificateTemplate` |
| Multiple template | ❌ |
| **QR Code** | ❌ (`qrcode.react` sudah ada di dependencies, belum dipakai) |
| Nomor sertifikat otomatis | ⚠️ `code` ada, belum ada format bernomor urut |
| Download PDF | ❌ Belum ada generator PDF |
| Halaman verifikasi | ✅ Sudah ada |

```
model CertificateTemplate {
  name           String
  backgroundUrl  String
  fieldPositions Json     // koordinat nama/nilai/tanggal/QR
  isDefault      Boolean
}
// Certificate.templateId String?
// Certificate.certificateNo String @unique  // format bernomor
```
Ditambah trigger otomatis: sertifikat terbit saat siswa memenuhi syarat LMS (Bab 3 "Sertifikat").

---

### C4. PEMBAYARAN — 🟡 SEDANG

**Sudah ada:** `Invoice` + `Payment` (TRANSFER/CASH/QRIS/MIDTRANS/XENDIT), upload bukti, verifikasi admin. Midtrans/Xendit sudah jalan untuk **Event** (`event-payment.ts`).

**Yang kurang:**
- **Midtrans untuk Invoice/SPP** — field `Invoice.enableOnlinePayment` & `onlinePaymentMethod` sudah ada di schema, tapi belum ada implementasi checkout + webhook untuk invoice (baru event yang punya)
- **Webhook handler terpusat** — `/api/payments/webhook/midtrans` untuk update status invoice & trigger komisi afiliator
- **Pembayaran PPDB** — belum ada karena PPDB belum ada
- **Instruksi pembayaran manual** yang dapat dikonfigurasi admin (Bab 10B)

---

### C5. KEUANGAN & LAPORAN — 🟡 SEDANG

**Sudah ada:** pemasukan/pengeluaran cabang, laporan, tunggakan/overdue.

**Yang kurang:**
- **Master kategori pengeluaran** — `BranchTransaction.category` masih string bebas → rawan tidak konsisten. Butuh `ExpenseCategory` & `IncomeCategory` (Bab 13 Data Master: *"Jenis pembayaran, Jenis pengeluaran"*)
- **Pendapatan per program** — butuh `Invoice.programId` (lihat B4)
- **Komisi afiliator di laporan keuangan** (Bab 9F) — bergantung modul Afiliator
- **Laporan harian/mingguan/tahunan** — saat ini fokus bulanan
- **Piutang (receivable)** — perlu dipisahkan dari sekadar `status: OVERDUE`

---

### C6. STATUS SISWA — 🟡 KECIL

Spesifikasi Bab 9C: `Aktif / Tunggakan / Nonaktif / Lulus / Berhenti`.

Saat ini hanya `User.isActive: Boolean` — tidak cukup granular.
```prisma
enum StudentStatus { AKTIF TUNGGAKAN NONAKTIF LULUS BERHENTI }
// UserProfile.studentStatus StudentStatus @default(AKTIF)
```

---

### C7. SEARCH / FILTER / EXPORT — 🟡 SEDANG

Spesifikasi Bab 21 & 22 mewajibkan **seluruh modul** punya search, filter, sort, pagination, **Export Excel**, **Export PDF**.

**Status:** search/filter/pagination ada di sebagian halaman admin. **Export Excel/PDF belum ada sama sekali** — meskipun `exceljs` dan `xlsx` **sudah terpasang di `package.json` tapi nol import di `src/`**.

Rekomendasi: helper generik
- `src/lib/export-excel.ts` (pakai `exceljs` yang sudah tersedia)
- `src/lib/export-pdf.ts` (perlu tambah `pdf-lib`)

Target modul: data siswa, nilai, soal, pembayaran, keuangan, jadwal, absensi, laporan, data afiliator.

**Import** (Excel/CSV/Word) juga belum ada — dibutuhkan minimal untuk data siswa & bank soal.

---

### C8. DASHBOARD — 🟡 SEDANG

**Sudah ada:** dashboard admin, guru, siswa, orang tua + `admin/analytics`.

**Yang perlu ditambah** agar sesuai Bab 11:
- Dashboard Super Admin: **total cabang, calon siswa (PPDB), komisi afiliator, jumlah peserta event, piutang** — belum ada karena modul terkait belum ada
- **Perbandingan performa antar cabang** (Bab 20) — belum ada
- Dashboard Siswa: **sertifikat, referral** (jika diaktifkan) — belum ada
- Dashboard Cabang khusus untuk role Admin Cabang — belum ada karena role-nya belum ada
- **Dashboard Afiliator** — modul baru

---

### C9. NOTIFIKASI — 🟡 KECIL

**Sudah ada:** `Notification` in-app, Email (3 provider), `sendWhatsApp()` di `src/lib/whatsapp.ts`.

**Yang kurang** — event trigger WhatsApp yang diminta Bab 12:
| Trigger | Status |
|---|---|
| Pendaftaran berhasil / diverifikasi | ❌ (PPDB belum ada) |
| Pembayaran diterima | ⚠️ perlu dicek |
| Pembayaran jatuh tempo / terlambat | ⚠️ butuh cron/scheduler |
| Jadwal kelas & perubahan jadwal | ❌ |
| Hasil ujian | ❌ |
| Sertifikat tersedia | ❌ |
| Komisi afiliator | ❌ (modul belum ada) |

Butuh juga **template pesan yang dapat diedit admin** + **scheduler** (cron) untuk reminder jatuh tempo.

> ⚠️ **Catatan infrastruktur:** dari sesi deploy terakhir, VPS mengalami `ETIMEDOUT` saat menghubungi `api.resend.com`. Outbound HTTPS VPS perlu dipastikan terbuka sebelum mengandalkan notifikasi email/WA.

---

### C10. ANNOUNCEMENT TARGETING — 🟡 KECIL

Saat ini `Announcement.targetRoles String[]` — hanya bisa target per role.

Spesifikasi Bab 17 meminta target: **cabang tertentu, program tertentu, kelas tertentu**, plus **gambar, file lampiran, tanggal mulai & berakhir**.

```prisma
model Announcement {
  targetBranchIds  String[]
  targetProgramIds String[]
  targetClassIds   String[]
  imageUrl         String?
  attachmentUrl    String?
  startDate        DateTime?
  endDate          DateTime?
}
```

---

### C11. LEADERBOARD EVENT — 🟡 KECIL

`EventRegistration` sudah punya `score` & `rank`. Yang kurang (Bab 5):
- **Konfigurasi tie-breaker** (nilai → waktu pengerjaan → kriteria lain)
- Penentuan otomatis Juara 1/2/3 & Top 10
- Halaman leaderboard publik
- Pengumuman pemenang

```prisma
model Event {
  rankingCriteria Json?   // ["score", "duration", ...]
  autoRanking     Boolean @default(true)
}
```

---

### C12. KEAMANAN — 🟡 SEDANG

Bab 19. Yang sudah ada: login aman, password hash, session, SSL, role dasar.

Yang perlu dibenahi:
| Item | Status |
|---|---|
| Audit log | ❌ (lihat B5) |
| Proteksi akses berdasarkan cabang | ⚠️ Perlu audit menyeluruh |
| Validasi upload file (tipe & ukuran) | ⚠️ Perlu dicek/diperketat |
| Backup database otomatis | ❌ Belum ada script |
| Proteksi manipulasi nilai | ❌ Butuh audit log + lock nilai final |
| Rate limiting (login/API) | ❌ Belum ada |

---

## BAGIAN D — ROADMAP EKSEKUSI

Mengikuti pembagian phase di Bab 25, disesuaikan dengan kondisi repo (banyak Phase 1–3 sudah selesai):

### TAHAP 1 — Fondasi Data Master & Ruangan
> Prasyarat untuk hampir semua modul lain. Kerjakan pertama.

1. `Program`, `EducationLevel`, `Level`, `AcademicYear`
2. `Building`, `Room` + migrasi `Class.room`/`Schedule.room` → `roomId`
3. `Schedule.teacherId` + validator anti-bentrok (`src/lib/schedule-conflict.ts`)
4. `ExpenseCategory` / `IncomeCategory`
5. `StudentStatus` di `UserProfile`
6. `AuditLog` + helper `src/lib/audit.ts`

### TAHAP 2 — PPDB
7. `Registration`, `RegistrationDocument`, `DocumentType`, `RegistrationStatusLog`
8. Form publik `/daftar` + generator nomor pendaftaran
9. Panel verifikasi `/admin/ppdb`
10. **Konversi otomatis calon siswa → siswa + akun orang tua + invoice** (transaksi atomik)
11. Notifikasi WA/email tiap perubahan status

### TAHAP 3 — Afiliator
12. `Affiliate`, `CommissionRule`, `Referral`, `Commission`, `CommissionPayout`
13. Link referral `/api/ref/[code]` + tracking klik + cookie
14. Integrasi ke PPDB (kode referral) & pembayaran (trigger komisi valid)
15. Dashboard afiliator + pengajuan pencairan
16. Anti-fraud validator

### TAHAP 4 — Role & Permission
17. `Permission` + `RolePermission`, tambah role Admin Cabang/Keuangan/Akademik/Afiliator
18. Audit menyeluruh enforcement scope cabang di semua query
19. Dashboard per role baru

### TAHAP 5 — Upgrade CBT
20. Media soal (`imageUrl`/`audioUrl`/`videoUrl`)
21. `QuestionGroup` + section untuk TOEFL
22. Multi-attempt (`maxAttempts`) + quiz per materi (`Exam.materialId`)
23. Import/Export soal (Word/Excel)
24. AI Question Generator
25. `shuffleOptions`, bank soal M:N, grading essay, rapor

### TAHAP 6 — Sertifikat, Pembayaran Online, Export
26. `CertificateTemplate` + QR Code + PDF + nomor otomatis
27. Midtrans untuk Invoice/SPP + webhook terpusat
28. Helper Export Excel/PDF + terapkan ke semua modul
29. Import data siswa

### TAHAP 7 — Website & Automation
30. `LandingPage` builder + `/lp/[slug]`
31. `SiteFaq`, `SiteTeamMember`, struktur organisasi, galeri prestasi
32. Halaman detail program publik + tombol daftar → PPDB
33. Announcement targeting diperluas
34. Scheduler notifikasi (reminder jatuh tempo, jadwal)
35. Leaderboard config + halaman publik
36. Backup otomatis + rate limiting

### TAHAP 8 — Jurnal Mengajar, Raport & Absensi Tutor
37. `TeachingJournal` — jurnal per pertemuan (materi, metode, refleksi) + UI guru/admin/orang tua
38. `ReportPeriod` + `ReportCard` + `ReportCardDetail` — generate rapor massal per kelas/periode, komentar wali kelas, publish, cetak PDF
39. `TeacherAttendance` — absensi tutor (manual/QR/kode) + rekap
40. `TeacherPayroll` — hitung honor dari kehadiran, approve, slip PDF
41. Notifikasi: rapor dipublish, jurnal belum diisi, payroll disetujui

---

## BAGIAN E — CATATAN TEKNIS

### Migrasi berisiko (butuh perhatian khusus)
| Perubahan | Risiko | Mitigasi |
|---|---|---|
| `Class.room` / `Schedule.room` String → `roomId` | 🔴 Data existing hilang | Script migrasi: buat `Room` dari nilai string unik per cabang, lalu map |
| Hapus `ExamAttempt @@unique([examId, studentId])` | 🟠 Logika existing mengandalkan 1 attempt | Audit semua query `findUnique` pada ExamAttempt |
| Tambah enum `UserRole` | 🟠 Semua guard `["ADMIN","SUPER_ADMIN"]` perlu direview | Sebaiknya langsung ke permission-based |
| `Invoice.programId` wajib | 🟠 Invoice lama tidak punya program | Buat nullable dulu, backfill, baru wajibkan |

### Dependencies

**Sudah terpasang tapi BELUM DIPAKAI sama sekali** (nol import di `src/`) — kabar baik, tinggal dimanfaatkan:
```
exceljs        ^4.4.0    → export/import Excel
xlsx           ^0.18.5   → parse Excel (duplikat dengan exceljs, pilih salah satu)
qrcode.react   ^4.2.0    → QR Code sertifikat
midtrans-client ^1.4.3   → dipakai hanya lewat REST di event-payment.ts
katex          ^0.17.0   → rumus matematika di soal
```

**Perlu ditambahkan:**
```
mammoth                             # parse .docx untuk import soal (template Word)
pdf-lib atau @react-pdf/renderer    # generate PDF sertifikat & laporan
qrcode                              # QR di server-side (untuk embed ke PDF)
@google/generative-ai atau openai   # AI Question Generator
```

### Prinsip yang harus dijaga (Bab 23)
**Single source of truth untuk data siswa.** Satu siswa = satu `User` + satu `UserProfile`, dipakai bersama oleh PPDB, akademik, LMS, CBT, jadwal, absensi, pembayaran, keuangan, sertifikat, referral. Jangan membuat tabel siswa terpisah di modul PPDB — gunakan `Registration.convertedUserId` sebagai jembatan.

### Yang sudah melebihi spesifikasi (nilai tambah, jangan dihapus)
Forum diskusi, Chat/Message, Live Session, Gamifikasi (Badge/Points/Leaderboard belajar), Feature Flags, Transfer kas antar cabang, Media Manager terpusat.
