# 📚 LMS Bimbingan Belajar — Rencana Arsitektur & Fitur Lengkap

> Sistem Manajemen Pembelajaran (LMS) yang dioptimalkan untuk lembaga bimbingan belajar (bimbel), dilengkapi dengan **Admin Feature Control Panel** untuk mengaktifkan/menonaktifkan fitur secara dinamis.

---

## 🗂️ Daftar Isi

1. [Overview Aplikasi](#overview-aplikasi)
2. [Tech Stack](#tech-stack)
3. [Struktur Peran Pengguna](#struktur-peran-pengguna)
4. [Daftar Fitur Lengkap](#daftar-fitur-lengkap)
5. [Admin Feature Control Panel](#admin-feature-control-panel)
6. [Struktur Direktori Proyek](#struktur-direktori-proyek)
7. [Skema Database](#skema-database)
8. [Alur Navigasi Aplikasi](#alur-navigasi-aplikasi)
9. [Roadmap Implementasi](#roadmap-implementasi)
10. [Saran & Masukan Pengembangan](#saran--masukan-pengembangan)

---

## 🎯 Overview Aplikasi

**Nama Aplikasi:** EduBimbel LMS  
**Target Pengguna:** Lembaga Bimbingan Belajar (offline & online)  
**Platform:** Web App (Next.js — responsive untuk mobile & desktop)  
**Konsep Utama:**
- Satu platform untuk **Admin, Guru, Siswa, dan Orang Tua**
- Admin dapat **mengaktifkan/menonaktifkan modul fitur** sesuai kebutuhan lembaga
- Fitur bersifat **modular** — lembaga kecil bisa mulai simpel, lembaga besar bisa aktifkan semua

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| State Management | Zustand |
| Database ORM | Prisma |
| Database | PostgreSQL (prod) / SQLite (dev) |
| Auth | NextAuth.js v5 |
| File Storage | Cloudinary / Supabase Storage |
| Rich Text Editor | TipTap |
| Charts | Recharts |
| PDF Generator | React-PDF |
| Video Player | Video.js / React Player |
| Notifikasi Real-time | Pusher / Socket.IO |
| Email | Nodemailer + React Email |
| Payment Gateway | Midtrans / Xendit |
| Deployment | Vercel + Railway (DB) |

---

## 👥 Struktur Peran Pengguna

### 1. 🔴 Super Admin
- Akses penuh ke seluruh sistem
- Kelola feature flags (aktifkan/nonaktifkan modul)
- Kelola data lembaga & konfigurasi global
- Akses laporan keuangan & analitik

### 2. 🟠 Admin / Staf
- Kelola data siswa, guru, kelas, jadwal
- Kelola pembayaran & tagihan
- Lihat laporan per modul yang diaktifkan
- Kirim pengumuman

### 3. 🟡 Guru / Pengajar
- Upload materi, tugas, soal ujian
- Tandai kehadiran siswa
- Input & lihat nilai siswa
- Berinteraksi di forum diskusi

### 4. 🟢 Siswa
- Akses materi & video pembelajaran
- Kerjakan tugas & ujian online
- Lihat jadwal & nilai
- Chat & diskusi
- Lihat progress belajar

### 5. 🔵 Orang Tua / Wali
- Monitor progress anak
- Lihat tagihan & histori pembayaran
- Terima notifikasi kehadiran & nilai
- Akses laporan perkembangan anak

---

## 📋 Daftar Fitur Lengkap

### 🏫 Modul 1: Manajemen Pengguna
- [x] Registrasi & Login (Email/Google)
- [x] Manajemen profil pengguna
- [x] Sistem peran & hak akses (RBAC)
- [x] Verifikasi email & reset password
- [x] Import data siswa (CSV/Excel)
- [x] Kartu Siswa Digital (PDF)

### 📅 Modul 2: Kelas & Jadwal
- [x] Buat & kelola kelas (reguler/privat/online)
- [x] Jadwal pertemuan (mingguan/insidental)
- [x] Kalender akademik
- [x] Notifikasi jadwal otomatis
- [x] Manajemen ruang/kelas fisik
- [x] Reschedule & pembatalan kelas

### 📖 Modul 3: Materi Pembelajaran
- [x] Upload materi (PDF, PPT, Word, gambar)
- [x] Video pembelajaran (upload/embed YouTube)
- [x] Organisasi per mata pelajaran & topik
- [x] Materi terstruktur (chapter/module)
- [x] Download materi offline
- [x] Rich text editor untuk konten interaktif

### ✏️ Modul 4: Tugas & Pekerjaan Rumah
- [x] Buat & bagikan tugas
- [x] Submit tugas (file upload / teks)
- [x] Deadline tracking & pengingat
- [x] Penilaian & feedback guru
- [x] Riwayat pengumpulan tugas

### 📝 Modul 5: Ujian & Kuis Online
- [x] Bank soal (pilgan, essay, benar/salah, isian)
- [x] Buat ujian dari bank soal (manual/acak)
- [x] Timer ujian
- [x] Anti-cheating (fullscreen mode, randomize soal)
- [x] Auto-grading (pilgan)
- [x] Review jawaban & pembahasan
- [x] Tryout / simulasi UTBK / Nasional

### 📊 Modul 6: Absensi
- [x] Absensi manual oleh guru
- [x] Absensi QR Code
- [x] Rekap kehadiran per siswa/kelas
- [x] Notifikasi ketidakhadiran ke orang tua
- [x] Laporan absensi bulanan (PDF)
- [x] Izin & alasan ketidakhadiran

### 🏆 Modul 7: Nilai & Rapor
- [x] Input nilai ulangan, tugas, ujian
- [x] Perhitungan nilai otomatis (bobot konfigurabel)
- [x] Rapor digital per periode
- [x] Ranking kelas
- [x] Grafik perkembangan nilai
- [x] Export rapor ke PDF

### 📈 Modul 8: Analitik & Laporan
- [x] Dashboard analitik admin
- [x] Progress belajar per siswa
- [x] Statistik kehadiran & nilai per kelas
- [x] Laporan kinerja guru
- [x] Analitik soal (tingkat kesulitan, daya pembeda)
- [x] Export laporan (PDF/Excel)

### 💰 Modul 9: Keuangan & Pembayaran
- [x] Tagihan SPP / biaya kursus
- [x] Pembayaran online (Midtrans/Xendit)
- [x] Pembayaran manual + konfirmasi admin
- [x] Reminder tagihan otomatis
- [x] Histori transaksi
- [x] Laporan keuangan bulanan

### 🔔 Modul 10: Notifikasi & Pengumuman
- [x] Pengumuman lembaga (broadcast)
- [x] Notifikasi in-app
- [x] Notifikasi WhatsApp (via API)
- [x] Notifikasi email
- [x] Notifikasi push (PWA)

### 💬 Modul 11: Forum Diskusi & Chat
- [x] Forum diskusi per mata pelajaran
- [x] Thread tanya jawab siswa-guru
- [x] Upvote jawaban terbaik
- [x] Chat private siswa-guru
- [x] Group chat per kelas

### 🎥 Modul 12: Kelas Online (Live)
- [x] Integrasi Zoom / Google Meet
- [x] Jadwal kelas online
- [x] Rekaman kelas tersimpan
- [x] Whiteboard digital
- [x] Raise hand & polling

### 🎖️ Modul 13: Gamifikasi & Motivasi
- [x] Poin & badge prestasi
- [x] Leaderboard siswa
- [x] Streak belajar harian
- [x] Sertifikat digital (PDF)
- [x] Level & XP system

### 👨‍👩‍👧 Modul 14: Portal Orang Tua
- [x] Akses nilai & absensi anak
- [x] Chat dengan guru
- [x] Lihat & bayar tagihan
- [x] Laporan perkembangan anak
- [x] Notifikasi real-time

### 📱 Modul 15: PWA & Offline
- [x] Installable sebagai app (PWA)
- [x] Akses materi offline (cached)
- [x] Sinkronisasi otomatis saat online

### 🏢 Modul 16: Multi-Cabang / Multi-Branch
- [ ] Master data cabang (nama, kode, alamat, kontak, kepala cabang)
- [ ] Assign user (siswa, guru, admin) ke cabang tertentu
- [ ] Assign kelas & jadwal ke cabang
- [ ] Tagihan, invoice, dan pembayaran per cabang
- [ ] Pemasukan & pengeluaran operasional per cabang
- [ ] Transfer kas antar-cabang dengan approval
- [ ] Laporan keuangan harian, mingguan, bulanan, tahunan per cabang
- [ ] Laporan gabungan (consolidated) semua cabang untuk super admin
- [ ] Role admin cabang (hanya lihat/kelola cabang sendiri)
- [ ] Filter cabang di seluruh dashboard & laporan
- [ ] PWA & notifikasi cabang-spesifik

---

## 🎛️ Admin Feature Control Panel

Ini adalah **fitur utama pembeda** aplikasi ini. Admin dapat mengaktifkan/menonaktifkan modul secara dinamis tanpa perlu deploy ulang.

### Konsep Feature Flag

```typescript
// Struktur Feature Flag
interface FeatureFlag {
  id: string;
  module: string;
  name: string;
  description: string;
  isActive: boolean;
  tier: 'basic' | 'standard' | 'premium';
  affectedRoles: ('admin' | 'guru' | 'siswa' | 'orangtua')[];
  lastModified: Date;
  modifiedBy: string;
}
```

### Daftar Feature Flags (15 Modul × Sub-fitur)

| Kode | Nama Fitur | Tier | Default |
|---|---|---|---|
| `FEAT_USER_MANAGEMENT` | Manajemen Pengguna | Basic | ✅ ON |
| `FEAT_CLASS_SCHEDULE` | Kelas & Jadwal | Basic | ✅ ON |
| `FEAT_MATERIALS` | Materi Pembelajaran | Basic | ✅ ON |
| `FEAT_ASSIGNMENTS` | Tugas & PR | Standard | ✅ ON |
| `FEAT_ONLINE_EXAM` | Ujian Online | Standard | ✅ ON |
| `FEAT_EXAM_BANK` | Bank Soal | Standard | ✅ ON |
| `FEAT_ATTENDANCE` | Absensi | Basic | ✅ ON |
| `FEAT_ATTENDANCE_QR` | Absensi QR Code | Standard | ❌ OFF |
| `FEAT_GRADES` | Nilai & Rapor | Basic | ✅ ON |
| `FEAT_ANALYTICS` | Analitik & Laporan | Standard | ✅ ON |
| `FEAT_PAYMENT` | Pembayaran Online | Premium | ❌ OFF |
| `FEAT_PAYMENT_MANUAL` | Pembayaran Manual | Basic | ✅ ON |
| `FEAT_WHATSAPP_NOTIF` | Notifikasi WhatsApp | Premium | ❌ OFF |
| `FEAT_EMAIL_NOTIF` | Notifikasi Email | Standard | ✅ ON |
| `FEAT_FORUM` | Forum Diskusi | Standard | ✅ ON |
| `FEAT_CHAT` | Chat Private | Standard | ❌ OFF |
| `FEAT_LIVE_CLASS` | Kelas Online Live | Premium | ❌ OFF |
| `FEAT_GAMIFICATION` | Gamifikasi & Badge | Standard | ❌ OFF |
| `FEAT_PARENT_PORTAL` | Portal Orang Tua | Standard | ✅ ON |
| `FEAT_PWA` | Mode Offline PWA | Standard | ✅ ON |
| `FEAT_TRYOUT` | Tryout Nasional | Premium | ❌ OFF |
| `FEAT_CERTIFICATE` | Sertifikat Digital | Standard | ❌ OFF |
| `FEAT_MULTI_BRANCH` | Multi-Cabang / Multi-Branch | Premium | ❌ OFF |

### UI Feature Control Panel

```
┌─────────────────────────────────────────────────────┐
│  🎛️ Feature Control Panel                           │
│  Filter: [Semua ▼]  [Basic ▼]  [Standard ▼]        │
├─────────────────────────────────────────────────────┤
│  📚 Materi Pembelajaran          [Standard] [●ON ]  │
│  Kelola upload & akses materi pembelajaran          │
│  Affects: Guru, Siswa                               │
├─────────────────────────────────────────────────────┤
│  💬 Chat Private                 [Standard] [○OFF]  │
│  Chat langsung antara siswa & guru                  │
│  Affects: Guru, Siswa                               │
├─────────────────────────────────────────────────────┤
│  💰 Pembayaran Online            [Premium] [○OFF]   │
│  Integrasi gateway pembayaran digital               │
│  Affects: Admin, Orang Tua                          │
└─────────────────────────────────────────────────────┘
```

### Bagaimana Feature Flag Bekerja

1. **Database:** Tabel `feature_flags` menyimpan status setiap fitur
2. **Context API:** `FeatureFlagContext` di-load saat app start
3. **Hook:** `useFeature('FEAT_CHAT')` digunakan di setiap komponen
4. **Guard:** Komponen/halaman yang disabled otomatis redirect/hidden
5. **Sidebar:** Menu navigasi menyesuaikan fitur yang aktif
6. **Cache:** Flag di-cache 5 menit, update real-time via Pusher

---

## 📁 Struktur Direktori Proyek

```
lms-bimbel/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grup rute autentikasi
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Grup rute utama (protected)
│   │   ├── admin/
│   │   │   ├── page.tsx          # Dashboard Admin
│   │   │   ├── features/         # ⭐ Feature Control Panel
│   │   │   ├── users/            # Manajemen Pengguna
│   │   │   ├── classes/          # Manajemen Kelas
│   │   │   ├── finance/          # Laporan Keuangan
│   │   │   └── settings/         # Pengaturan Sistem
│   │   ├── guru/
│   │   │   ├── page.tsx          # Dashboard Guru
│   │   │   ├── kelas/            # Kelas saya
│   │   │   ├── materi/           # Upload materi
│   │   │   ├── tugas/            # Kelola tugas
│   │   │   ├── ujian/            # Buat ujian
│   │   │   ├── absensi/          # Input absensi
│   │   │   └── nilai/            # Input nilai
│   │   ├── siswa/
│   │   │   ├── page.tsx          # Dashboard Siswa
│   │   │   ├── materi/           # Materi saya
│   │   │   ├── tugas/            # Tugas saya
│   │   │   ├── ujian/            # Ikut ujian
│   │   │   ├── jadwal/           # Jadwal belajar
│   │   │   ├── nilai/            # Nilai saya
│   │   │   └── forum/            # Diskusi
│   │   └── orangtua/
│   │       ├── page.tsx          # Dashboard Orang Tua
│   │       ├── anak/             # Data anak
│   │       └── tagihan/          # Tagihan
│   └── api/                      # API Routes
│       ├── auth/
│       ├── features/             # Feature flag API
│       ├── users/
│       ├── classes/
│       ├── materials/
│       ├── assignments/
│       ├── exams/
│       ├── attendance/
│       ├── grades/
│       └── payments/
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx           # Sidebar dinamis (sesuai fitur aktif)
│   │   ├── Header.tsx
│   │   └── Breadcrumb.tsx
│   ├── features/                 # ⭐ Feature flag components
│   │   ├── FeatureGuard.tsx      # Guard wrapper
│   │   ├── FeatureToggle.tsx     # Toggle switch
│   │   └── FeatureBadge.tsx      # Badge tier
│   ├── dashboard/                # Dashboard widgets
│   ├── classes/
│   ├── materials/
│   ├── exams/
│   ├── attendance/
│   ├── grades/
│   └── payments/
├── lib/
│   ├── feature-flags.ts          # ⭐ Feature flag logic
│   ├── auth.ts
│   ├── db.ts                     # Prisma client
│   └── utils.ts
├── hooks/
│   ├── useFeature.ts             # ⭐ Hook untuk cek feature aktif
│   ├── useAuth.ts
│   └── useDashboard.ts
├── context/
│   └── FeatureFlagContext.tsx    # ⭐ Global feature flag context
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── icons/
│   └── manifest.json             # PWA manifest
└── types/
    ├── feature-flags.ts
    ├── user.ts
    └── index.ts
```

---

## 🗄️ Skema Database

### Tabel Utama

```sql
-- Users & Auth
users (id, name, email, password, role, avatar, isActive, createdAt)
user_profiles (id, userId, phone, address, birthDate, parentName, parentPhone)

-- Feature Flags ⭐
feature_flags (id, code, name, description, isActive, tier, modifiedBy, updatedAt)
feature_flag_roles (flagId, role)

-- Akademik
subjects (id, name, code, description, color, icon)
classes (id, name, subjectId, teacherId, type[reguler/privat/online], maxStudents)
class_students (classId, studentId, enrolledAt)
schedules (id, classId, dayOfWeek, startTime, endTime, room, isRecurring)
schedule_exceptions (id, scheduleId, date, reason, replacementDate)

-- Materi
materials (id, title, description, classId, subjectId, type, fileUrl, order, isPublished)
material_progress (materialId, studentId, isCompleted, completedAt)

-- Tugas & Ujian
assignments (id, title, classId, teacherId, dueDate, maxScore, isPublished)
submissions (id, assignmentId, studentId, fileUrl, content, score, feedback)
exams (id, title, classId, duration, startTime, endTime, isRandomized, passingScore)
questions (id, examId, type, content, options, correctAnswer, score, difficulty)
exam_attempts (id, examId, studentId, startedAt, submittedAt, score, answers)

-- Absensi
attendance (id, classId, scheduleId, date)
attendance_records (attendanceId, studentId, status[hadir/izin/sakit/alpha], note)

-- Nilai
grade_components (id, classId, name[UH/UTS/UAS/Tugas], weight, period)
grades (id, studentId, componentId, score)

-- Keuangan
billing_plans (id, name, amount, period, description)
invoices (id, studentId, planId, amount, dueDate, status[unpaid/paid/overdue])
payments (id, invoiceId, amount, method, proofUrl, confirmedAt, confirmedBy)

-- Multi-Cabang
branches (id, code, name, address, phone, email, managerName, isActive, createdAt)
branch_users (branchId, userId, roleAtBranch)
branch_classes (branchId, classId)
branch_invoices (branchId, invoiceId)
branch_transactions (id, branchId, type[income/expense/transfer], category, amount, date, note, attachmentUrl, createdBy)
branch_cash_transfers (id, fromBranchId, toBranchId, amount, status[pending/approved/rejected], requestedBy, approvedBy, createdAt)

-- Notifikasi
notifications (id, userId, title, content, type, isRead, createdAt)
announcements (id, title, content, targetRoles[], publishedAt, expiresAt)

-- Gamifikasi
badges (id, name, description, icon, criteria)
student_badges (studentId, badgeId, earnedAt)
student_points (studentId, points, level, streak)
```

---

## 🗺️ Alur Navigasi Aplikasi

```
Landing Page (/)
│
├── Login (/login)
│   └── [Redirect berdasarkan role]
│       ├── /admin/dashboard
│       ├── /guru/dashboard
│       ├── /siswa/dashboard
│       └── /orangtua/dashboard
│
└── Dashboard (role-based)
    │
    ├── [ADMIN] ─────────────────────────────────────
    │   ├── 📊 Dashboard
    │   ├── 🎛️ Feature Control Panel ⭐
    │   ├── 👥 Manajemen Pengguna
    │   │   ├── Daftar Siswa
    │   │   ├── Daftar Guru
    │   │   └── Import Data (CSV)
    │   ├── 📅 Kelas & Jadwal
    │   ├── 💰 Keuangan
    │   │   ├── Tagihan & SPP
    │   │   ├── Konfirmasi Pembayaran
    │   │   └── Laporan Keuangan
    │   ├── 🏢 Multi-Cabang [FEAT_MULTI_BRANCH]
    │   │   ├── Master Cabang
    │   │   ├── Assign User & Kelas
    │   │   ├── Kas & Transfer Antar Cabang
    │   │   └── Laporan Cabang / Konsolidasi
    │   ├── 📢 Pengumuman
    │   └── ⚙️ Pengaturan Sistem
    │
    ├── [GURU] ───────────────────────────────────────
    │   ├── 📊 Dashboard
    │   ├── 📚 Kelas Saya
    │   ├── 📖 Materi [FEAT_MATERIALS]
    │   ├── ✏️ Tugas [FEAT_ASSIGNMENTS]
    │   ├── 📝 Ujian [FEAT_ONLINE_EXAM]
    │   ├── ✅ Absensi [FEAT_ATTENDANCE]
    │   ├── 🏆 Nilai [FEAT_GRADES]
    │   └── 💬 Forum [FEAT_FORUM]
    │
    ├── [SISWA] ──────────────────────────────────────
    │   ├── 📊 Dashboard
    │   ├── 📖 Materi Saya [FEAT_MATERIALS]
    │   ├── ✏️ Tugas Saya [FEAT_ASSIGNMENTS]
    │   ├── 📝 Ujian [FEAT_ONLINE_EXAM]
    │   ├── 📅 Jadwal
    │   ├── 🏆 Nilai & Rapor [FEAT_GRADES]
    │   ├── 💬 Forum [FEAT_FORUM]
    │   ├── 🎖️ Prestasi [FEAT_GAMIFICATION]
    │   └── 💬 Chat [FEAT_CHAT]
    │
    └── [ORANG TUA] ──────────────────────────────────
        ├── 📊 Dashboard
        ├── 👦 Progress Anak [FEAT_PARENT_PORTAL]
        ├── ✅ Absensi Anak [FEAT_ATTENDANCE]
        ├── 🏆 Nilai Anak [FEAT_GRADES]
        └── 💰 Tagihan [FEAT_PAYMENT_MANUAL]
```

---

## 🚀 Roadmap Implementasi

### Phase 1 — MVP (Minggu 1-4)
- [x] Setup project & konfigurasi
- [ ] Autentikasi (Login, Register, RBAC)
- [ ] ⭐ Feature Flag System (DB + Context + Hook + Admin UI)
- [ ] Layout & Sidebar dinamis
- [ ] Dashboard per role (Admin, Guru, Siswa)
- [ ] Manajemen Kelas & Jadwal (CRUD)
- [ ] Materi Pembelajaran (Upload, View)
- [ ] Absensi manual

### Phase 2 — Core Learning (Minggu 5-8)
- [ ] Bank Soal & Ujian Online
- [ ] Tugas & Pengumpulan
- [ ] Nilai & Rapor
- [ ] Notifikasi in-app & email
- [ ] Pengumuman

### Phase 3 — Advanced (Minggu 9-12)
- [ ] Pembayaran (manual + online gateway)
- [ ] Portal Orang Tua
- [ ] Forum Diskusi
- [ ] Laporan & Analitik (charts)
- [ ] Export PDF (rapor, absensi, keuangan)

### Phase 4 — Premium (Minggu 13-16)
- [ ] Gamifikasi (poin, badge, leaderboard)
- [ ] Kelas Online Live (Zoom integration)
- [ ] Notifikasi WhatsApp
- [ ] Tryout Nasional
- [ ] PWA & offline mode
- [ ] Absensi QR Code
- [ ] Multi-Cabang / Multi-Branch (master cabang, assign user, laporan konsolidasi)

---

## 💡 Saran & Masukan Pengembangan

### ✅ Kelebihan Konsep Ini
1. **Feature Flag System** → Solusi tepat untuk lembaga dengan skala & kebutuhan berbeda
2. **Multi-role** → Ekosistem lengkap dalam 1 platform
3. **Modular** → Mudah dikembangkan tanpa merusak fitur existing

### ⚠️ Hal yang Perlu Diperhatikan

#### 1. Performa
- Gunakan **React Query / SWR** untuk caching data
- Implementasi **lazy loading** pada modul yang tidak aktif
- Gunakan **Edge Runtime** Next.js untuk API yang sering dipanggil

#### 2. Keamanan
- Validasi feature flag di **server-side** (bukan hanya client-side)
- RBAC harus dicek di **middleware + API level**
- Enkripsi data sensitif (nilai, keuangan)
- Rate limiting pada API endpoint

#### 3. UX/UI
- Berikan **onboarding wizard** untuk admin pertama kali
- Tampilkan **preview/mockup** fitur yang sedang dinonaktifkan (mode preview)
- Fitur yang disabled → tampilkan pesan "Hubungi admin untuk mengaktifkan"

#### 4. Bisnis
- Pertimbangkan model **berlangganan per tier** (Basic/Standard/Premium)
- Feature flag bisa dikaitkan dengan **lisensi/paket** yang dibeli lembaga
- Sediakan **trial mode** untuk fitur Premium (30 hari gratis)

#### 5. Skalabilitas
- Rancang DB dengan **multi-tenant** dari awal (1 instance untuk banyak lembaga)
- Pisahkan storage file per lembaga
- Gunakan **queue/job system** untuk proses berat (generate PDF, kirim email massal)

### 🎯 Prioritas Fitur untuk Bimbel Kecil-Menengah

| Prioritas | Fitur | Alasan |
|---|---|---|
| ⭐⭐⭐ | Jadwal & Absensi | Kebutuhan utama operasional harian |
| ⭐⭐⭐ | Materi & Tugas | Nilai utama LMS |
| ⭐⭐⭐ | Nilai & Rapor | Feedback ke siswa & orang tua |
| ⭐⭐⭐ | Notifikasi (WA/Email) | Komunikasi efektif ke orang tua |
| ⭐⭐ | Ujian Online | Efisiensi penilaian |
| ⭐⭐ | Pembayaran SPP | Otomasi keuangan |
| ⭐ | Gamifikasi | Engagement siswa |
| ⭐ | Kelas Live | Untuk bimbel online |

---

## 📝 Catatan Implementasi

```
Versi Dokumen : 1.0
Dibuat         : Juni 2026
Status         : Draft / Planning
Selanjutnya    : Implementasi Phase 1 (Setup + Feature Flag System)
```

---

*Dokumen ini akan diperbarui seiring perkembangan implementasi.*
