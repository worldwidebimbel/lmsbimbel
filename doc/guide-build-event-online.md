# Guide: Sistem Event Online Berbayar

> Panduan lengkap alur event (Tryout, Olimpiade, Workshop) — role yang terlibat, fitur yang sudah dibangun, dan gap yang tersisa.

---

## 1. Role yang Terlibat

| Role | Peran dalam Event |
|---|---|
| **SUPER_ADMIN** | Buat/kelola event semua cabang, kelola soal ujian, verifikasi peserta, terbitkan sertifikat, hitung ranking, lihat leaderboard |
| **ADMIN** | Sama seperti SUPER_ADMIN (akses penuh) |
| **ADMIN_CABANG** | Buat/kelola event di cabangnya, kelola soal, verifikasi peserta, terbitkan sertifikat, hitung ranking |
| **GURU** | Buat/kelola event (via `/guru/events`), kelola soal ujian event, pilih dari bank soal |
| **SISWA** | Lihat event publik, daftar event, bayar (jika berbayar), kerjakan ujian, lihat hasil & leaderboard, download sertifikat |
| **ORANG_TUA** | Bisa mendaftarkan anak ke event (via API register) |
| **PUBLIC (tanpa login)** | Lihat event publik di `/events`, daftar via public-register (auto-create akun SISWA) |

---

## 2. Alur Lengkap Event

```
ADMIN/GURU membuat Event
    ↓
Set status → PUBLISHED (tampil di /events)
    ↓
PESERTA melihat landing page /events/[id]
    ↓
PESERTA mendaftar:
  - Sudah login → POST /api/events/[id]/register
  - Belum login → POST /api/events/[id]/public-register (auto-create akun)
    ↓
Jika berbayar → POST /api/events/[id]/pay (Midtrans/Duitku)
    ↓
ADMIN verifikasi pembayaran → PATCH /api/admin/events/[id]/registrations
    ↓
Status registrasi: PENDING → CONFIRMED
    ↓
ADMIN/GURU membuat Ujian (Exam) untuk event
    ↓
Set Exam.isPublished = true
    ↓
PESERTA kerjakan ujian di /events/[id]/exam
    ↓
Submit jawaban → POST /api/events/[id]/exam/submit
    ↓
Sistem auto-grade (PILGAN, TRUE_FALSE, ISIAN)
    ↓
Score tersimpan di ExamAttempt + EventRegistration.score
    ↓
ADMIN hitung ranking → POST /api/events/[id]/ranking
    ↓
Sistem tentukan Juara 1/2/3 + Top 10
    ↓
ADMIN terbitkan sertifikat → POST /api/admin/events/[id]/sertifikat
  - Juara 1-3 → Certificate type: EVENT_WINNER
  - Peserta lain → Certificate type: EVENT_PARTICIPATION
    ↓
PESERTA download sertifikat di /siswa/sertifikat
PESERTA lihat hasil di /events/[id]/results
PESERTA lihat leaderboard di /events/[id]/leaderboard
```

---

## 3. Struktur File & Komponen

### 3.1 Halaman Admin (`/admin/events`)

| Path | Fungsi |
|---|---|
| `src/app/admin/events/page.tsx` | List event + CRUD (create/edit/delete) |
| `src/app/admin/events/[id]/exam/page.tsx` | Kelola ujian event (buat exam, tambah soal) |
| `src/app/admin/events/[id]/registrations/page.tsx` | List peserta + verifikasi pembayaran |
| `src/app/admin/events/[id]/sertifikat/page.tsx` | Terbitkan sertifikat peserta |

### 3.2 Halaman Guru (`/guru/events`)

| Path | Fungsi |
|---|---|
| `src/app/guru/events/page.tsx` | List event + CRUD (reuse `EventsClient` dengan `basePath`) |
| `src/app/guru/events/[id]/exam/page.tsx` | Kelola ujian event (reuse `EventExamAdminClient`) |

### 3.3 Halaman Publik (`/events`)

| Path | Fungsi |
|---|---|
| `src/app/events/page.tsx` | List event published (landing page publik) |
| `src/app/events/[id]/page.tsx` | Detail event + pendaftaran |
| `src/app/events/[id]/exam/page.tsx` | Kerjakan ujian (butuh registrasi + login) |
| `src/app/events/[id]/results/page.tsx` | Hasil & peringkat peserta |
| `src/app/events/[id]/leaderboard/page.tsx` | Leaderboard publik |

### 3.4 Halaman Siswa (`/siswa/tryout`)

| Path | Fungsi |
|---|---|
| `src/app/siswa/tryout/page.tsx` | List tryout yang tersedia + status pengerjaan |

### 3.5 API Routes — Admin

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/admin/events` | GET, POST | List & create event |
| `/api/admin/events/[id]` | GET, PATCH, DELETE | Detail, update, delete event |
| `/api/admin/events/[id]/exam` | GET, POST, PATCH | Get/create/update exam |
| `/api/admin/events/[id]/exam/questions` | POST, DELETE | Add/delete soal |
| `/api/admin/events/[id]/registrations` | GET, PATCH | List & update status peserta |
| `/api/admin/events/[id]/sertifikat` | POST | Terbitkan sertifikat |

### 3.6 API Routes — Publik/Peserta

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/events/[id]` | GET | Detail event publik |
| `/api/events/[id]/register` | POST | Daftar event (butuh login) |
| `/api/events/[id]/public-register` | POST | Daftar event (auto-create akun) |
| `/api/events/[id]/pay` | POST | Bayar event via payment gateway |
| `/api/events/[id]/exam` | GET | Ambil soal ujian |
| `/api/events/[id]/exam/submit` | POST | Submit jawaban ujian |
| `/api/events/[id]/ranking` | GET, POST | Get/calculate ranking |
| `/api/events/[id]/results` | GET | Hasil peserta |

### 3.7 Komponen

| Komponen | Lokasi | Fungsi |
|---|---|---|
| `EventsClient` | `src/components/admin/EventsClient.tsx` | UI list + form CRUD event (dipakai admin & guru) |
| `EventExamAdminClient` | `src/components/admin/EventExamAdminClient.tsx` | UI kelola exam + soal (dipakai admin & guru) |
| `EventRegistrationsClient` | `src/components/admin/EventRegistrationsClient.tsx` | UI list peserta + verifikasi |
| `EventSertifikatClient` | `src/components/admin/EventSertifikatClient.tsx` | UI terbitkan sertifikat |
| `EventDetailClient` | `src/components/event/EventDetailClient.tsx` | UI detail event untuk peserta |
| `EventExamClient` | `src/components/event/EventExamClient.tsx` | UI pengerjaan ujian peserta |

### 3.8 Library

| File | Fungsi |
|---|---|
| `src/lib/event-payment.ts` | Integrasi payment gateway (Duitku/Midtrans) |
| `src/lib/event-ranking.ts` | Mesin ranking dengan tie-breaker (score → duration) |
| `src/lib/certificate.ts` | Generator nomor sertifikat + QR code |
| `src/lib/certificate-trigger.ts` | Trigger otomatis terbit sertifikat |

---

## 4. Schema Database

### Model `Event`
```
id, branchId, title, description, type (TRYOUT|OLIMPIADE|WORKSHOP),
status (DRAFT|PUBLISHED|ONGOING|COMPLETED|CANCELLED),
startDate, endDate, registrationDeadline, location, image,
maxParticipants, isPaid, rankingCriteria (Json), autoRanking (Boolean),
createdBy, createdAt, updatedAt
```

### Model `EventPackage`
```
id, eventId, name, price, description, isActive
```

### Model `EventRegistration`
```
id, eventId, userId, packageId,
status (PENDING|CONFIRMED|ATTENDED|CANCELLED),
paymentStatus (FREE|PENDING|PAID|CANCELLED),
price, paymentMethod, paymentToken, externalId, paymentProofUrl,
paidAt, registeredAt, attendedAt, score, rank, certificateUrl
@@unique([eventId, userId])
```

### Model `Exam` (shared dengan CBT kelas)
```
id, title, description, duration, startTime, endTime,
isRandomized, passingScore, isPublished, maxAttempts,
scoringMode (SUM|AVG|BEST|LAST), shuffleOptions,
eventId? (nullable — jika event), materialId? (nullable — jika materi LMS)
```

### Model `Certificate`
```
id, code, certificateNo, userId, type (LMS_COMPLETION|EVENT_PARTICIPATION|EVENT_WINNER),
title, recipientName, eventId?, eventName?, templateId?, score, rank, issuedAt
```

---

## 5. Permission Mapping

| Permission | SUPER_ADMIN | ADMIN | ADMIN_CABANG | GURU | ADMIN_AKADEMIK | ADMIN_KEUANGAN |
|---|---|---|---|---|---|---|
| `event.view` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `event.manage` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

> **Catatan:** ADMIN_AKADEMIK dan ADMIN_KEUANGAN tidak punya akses event sesuai spesifikasi. ADMIN_AKADEMIK fokus pada program/kelas/tutor/jadwal/siswa. ADMIN_KEUANGAN fokus pada pembayaran/keuangan.

---

## 6. Status Alur Event

```
DRAFT → PUBLISHED → ONGOING → COMPLETED
                    ↓
               CANCELLED
```

| Status | Arti | Trigger |
|---|---|---|
| `DRAFT` | Event dibuat, belum publik | Admin create event |
| `PUBLISHED` | Tampil di `/events`, pendaftaran dibuka | Admin set status |
| `ONGOING` | Event sedang berlangsung (ujian dibuka) | Manual atau otomatis saat startDate tercapai |
| `COMPLETED` | Event selesai, ranking dihitung, sertifikat terbit | Manual setelah selesai |
| `CANCELLED` | Event dibatalkan | Admin |

---

## 7. Status Registrasi Peserta

```
PENDING → CONFIRMED → ATTENDED
   ↓
CANCELLED
```

| Status | Arti |
|---|---|
| `PENDING` | Terdaftar, menunggu verifikasi pembayaran (jika berbayar) |
| `CONFIRMED` | Pembayaran terverifikasi / event gratis → bisa kerjakan ujian |
| `ATTENDED` | Peserta hadir/mengerjakan ujian |
| `CANCELLED` | Peserta batal |

### Payment Status

| Status | Arti |
|---|---|
| `FREE` | Event gratis |
| `PENDING` | Menunggu pembayaran |
| `PAID` | Pembayaran lunas |
| `CANCELLED` | Pembayaran dibatalkan |

---

## 8. Fitur yang Sudah Dibangun

- [x] CRUD event (create, edit, delete) dengan branch scope
- [x] Event packages (paket harga)
- [x] Landing page publik `/events` + detail `/events/[id]`
- [x] Pendaftaran untuk user login (`/api/events/[id]/register`)
- [x] Pendaftaran untuk public tanpa login (`/api/events/[id]/public-register`) — auto-create akun SISWA
- [x] Pembayaran via payment gateway (Duitku/Midtrans) — `src/lib/event-payment.ts`
- [x] Verifikasi peserta oleh admin (update status registrasi)
- [x] Buat ujian event + tambah soal (PILGAN, TRUE_FALSE, ESSAY, dll)
- [x] Soal mendukung gambar, audio, video
- [x] Math renderer (KaTeX) untuk soal
- [x] Pengerjaan ujian peserta di `/events/[id]/exam`
- [x] Auto-grading untuk soal objektif
- [x] Max attempts + scoring mode (SUM/AVG/BEST/LAST)
- [x] Exam sections & question groups (TOEFL-style)
- [x] Timer per section + simpan sisa waktu di server
- [x] Halaman hasil `/events/[id]/results`
- [x] Halaman leaderboard `/events/[id]/leaderboard`
- [x] Mesin ranking dengan tie-breaker (score → duration) — `src/lib/event-ranking.ts`
- [x] Field `rankingCriteria` (Json) + `autoRanking` (Boolean) di schema
- [x] API trigger ranking → auto-create sertifikat Juara 1-3
- [x] Terbitkan sertifikat peserta (EVENT_PARTICIPATION) & pemenang (EVENT_WINNER)
- [x] Sertifikat dengan QR code + halaman verifikasi `/sertifikat/[code]`
- [x] Download sertifikat PDF
- [x] Halaman tryout siswa `/siswa/tryout`
- [x] Akses GURU ke `/guru/events` + `/guru/events/[id]/exam`
- [x] Branch scope (admin cabang hanya lihat event cabangnya)
- [x] Image upload untuk banner event (Cloudinary)

---

## 9. Gap / Yang Belum Selesai

Berdasarkan `build-roadmap-checklist.md` Tahap 7.6:

- [ ] **Penentuan otomatis Juara 1/2/3 & Top 10** — schema ada (`rankingCriteria`, `autoRanking`), API ranking ada, tapi belum ada UI admin untuk konfigurasi kriteria ranking (tie-breaker berurutan)
- [ ] **Pengumuman pemenang** — belum ada halaman/trigger pengumuman otomatis
- [ ] **Auto-ranking trigger** — `autoRanking` field ada tapi belum ada cron/trigger yang otomatis hitung ranking saat event selesai
- [ ] **Notifikasi hasil** — belum ada notifikasi ke peserta saat hasil/ranking dipublikasi
- [ ] **Leaderboard real-time** — leaderboard saat ini fetch sekali, belum auto-refresh

### Gap lain (non-checklist):

- [ ] **Landing page event custom** — spesifikasi menyebut "Landing page event" tapi saat ini hanya detail page standar
- [ ] **Export peserta event** — belum ada export Excel/CSV daftar peserta
- [ ] **Email konfirmasi pendaftaran** — belum ada email otomatis setelah daftar
- [ ] **WhatsApp notification** — spesifikasi menyebut WhatsApp notification untuk event, belum diimplementasi

---

## 10. Cara Membuat Event Tryout (Step-by-step)

### Untuk Admin / Super Admin

1. Login → masuk ke `/admin/events`
2. Klik **"Tambah Event"**
3. Isi form:
   - **Judul**: "Tryout UTBK 2026 Sesi 1"
   - **Tipe**: TRYOUT
   - **Status**: DRAFT (sementara)
   - **Tanggal mulai**: tanggal ujian
   - **Deadline pendaftaran**: batas waktu daftar
   - **Berbayar**: ya/tidak
   - **Cabang**: pilih cabang
   - **Paket**: tambah paket (misal: "Reguler Rp 50.000", "Premium Rp 100.000")
   - **Banner**: upload gambar
4. Simpan → ubah status ke **PUBLISHED**
5. Klik tombol **Ujian** di kartu event → buat exam:
   - Judul ujian, durasi, passing score
   - Tambah soal (PILGAN, ESSAY, dll) atau pilih dari Bank Soal
   - Publikasikan exam (`isPublished = true`)
6. Peserta mendaftar → verifikasi pembayaran di tab **Peserta**
7. Setelah ujian selesai → klik **hitung ranking** di leaderboard
8. Klik **Sertifikat** → terbitkan sertifikat untuk semua peserta
9. Ubah status event ke **COMPLETED**

### Untuk Guru

1. Login → masuk ke `/guru/events`
2. Alur sama seperti admin, tapi event terikat ke cabang guru

---

## 11. Integrasi dengan Modul Lain

| Modul | Integrasi |
|---|---|
| **Pembayaran** | Event berbayar → payment gateway (Duitku) → webhook update paymentStatus |
| **Sertifikat** | Sertifikat otomatis (EVENT_WINNER / EVENT_PARTICIPATION) dengan QR code |
| **CBT** | Exam model dipakai bersama (eventId nullable). Soal bisa dari Bank Soal |
| **Keuangan** | Pembayaran event masuk ke laporan keuangan sebagai pemasukan |
| **Dashboard** | Admin dashboard menampilkan "Event aktif" & "Jumlah peserta event" |
| **Multi-cabang** | Event terikat ke cabang, admin cabang hanya kelola event cabangnya |
| **User Management** | Public-register auto-create akun SISWA + UserProfile |
