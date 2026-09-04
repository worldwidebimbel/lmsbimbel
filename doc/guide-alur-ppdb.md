# Guide: Smoke Test Alur PPDB (daftar → upload dokumen → verifikasi → bayar → konversi siswa → kelas → jadwal)

> Task: `Hari 3-4 — Smoke Test Menyeluruh` — Alur PPDB end-to-end (timeline-4-minggu.md).
> Dokumen ini adalah test script langkah-demi-langkah sekaligus referensi cara kerja modul PPDB.

---

## 1. Peta Alur & Aktor

```
[Pendaftar - publik]                    [Admin]
/daftar (form 5 langkah)          /admin/ppdb (list + detail)
  1 Program → 2 Data Diri →         SUBMITTED → WAITING_VERIFICATION
  3 Orang Tua → 4 Dokumen →                → VERIFIED
  5 Review → submit                → WAITING_PAYMENT → PAYMENT_VERIFIED
       │                                    → ACCEPTED
  /daftar/status (cek status)               → CLASS_PLACEMENT
                                           → [Konversi ke Siswa Aktif]
                                                  │
[Siswa hasil konversi]                     ACTIVE_STUDENT
login kredensial sementara ──┘             (akun SISWA + ORANG_TUA + invoice + enroll kelas)
/siswa/jadwal ← jadwal kelas ← /admin/classes/[id]/schedules
```

**State machine pendaftaran** (di-enforce oleh `src/lib/ppdb-status.ts` — transisi lain ditolak API):

| Status | Label | Transisi diizinkan |
|---|---|---|
| SUBMITTED | Submitted | WAITING_VERIFICATION, REJECTED, CANCELLED |
| WAITING_VERIFICATION | Menunggu Verifikasi | VERIFIED, REJECTED, SUBMITTED, CANCELLED |
| VERIFIED | Terverifikasi | WAITING_PAYMENT, REJECTED, CANCELLED |
| WAITING_PAYMENT | Menunggu Pembayaran | PAYMENT_VERIFIED, CANCELLED, VERIFIED |
| PAYMENT_VERIFIED | Pembayaran Terverifikasi | ACCEPTED, CANCELLED |
| ACCEPTED | Diterima | CLASS_PLACEMENT, CANCELLED |
| CLASS_PLACEMENT | Penempatan Kelas | ACTIVE_STUDENT, CANCELLED |
| ACTIVE_STUDENT / REJECTED / CANCELLED | — | terminal |

Setiap perubahan status: tercatat di **Riwayat Status**, audit log, notifikasi email/WA ke pendaftar, dan memicu advance komisi afiliator (VERIFIED/PAYMENT_VERIFIED/CANCELLED).

---

## 2. Prasyarat & Persiapan Data

- [ ] Akun admin (mis. `admin@lmsbimbel.id` / `admin123`) dengan akses menu **PPDB**
- [ ] **Program aktif** yang terhubung min. 1 cabang (form `/daftar` memuat program aktif; pilihan cabang mengikuti program) — cek `/admin/cms/programs` atau modul program
- [ ] **Jenis Dokumen (DocumentType) aktif** — ⚠️ belum ada UI kelolanya; insert manual (lihat 2.1)
- [ ] **Cloudinary terkonfigurasi** (env `CLOUDINARY_*`) — tanpa ini upload dokumen gagal 503 "Layanan upload belum dikonfigurasi"
- [ ] **Kelas tersedia** untuk penempatan siswa (Admin → **Kelas & Jadwal**) dengan mapel & guru pengampu
- [ ] (Opsional, hanya jika ingin test pembayaran online) **Duitku terkonfigurasi** (sandbox OK)
- [ ] Browser 2 jendela: satu sebagai admin, satu sebagai pendaftar publik (incognito)

### 2.1 Insert Jenis Dokumen (sekali saja, jika belum ada)

Via SQL (tabel `document_types`):

```sql
INSERT INTO "document_types" (id, name, "isRequired", "maxSizeMb", "allowedTypes", "isActive", "order")
VALUES
  (gen_random_uuid(), 'Pas Foto 3x4', true, 2, ARRAY['jpg','jpeg','png'], true, 1),
  (gen_random_uuid(), 'Kartu Keluarga', true, 5, ARRAY['pdf','jpg','jpeg','png'], true, 2),
  (gen_random_uuid(), 'Rapor Semester Terakhir', false, 5, ARRAY['pdf'], true, 3);
```

Atau via Prisma Studio (`npx prisma studio` → model DocumentType). Kolom penting: `allowedTypes` (ekstensi tanpa titik), `maxSizeMb`, `isRequired`, `isActive`.

---

## 3. Bagian A — Pendaftar: Daftar + Upload Dokumen

Jendela incognito (tanpa login).

### A1 — Buka form & isi 5 langkah

1. Buka `/daftar` (bisa juga dari landing page → tombol CTA "Daftar").
2. **Langkah 1 — Program**: pilih program (harga tampil) → pilih cabang yang tersedia untuk program itu. → **Lanjut**
3. **Langkah 2 — Data Diri**: nama lengkap, tempat & tanggal lahir, jenis kelamin, (opsional: NIK, asal sekolah, kelas, alamat, WhatsApp, email). → **Lanjut**
   - Isi **email + WhatsApp** (dipakai untuk notifikasi & kredensial akun nanti).
4. **Langkah 3 — Orang Tua**: nama orang tua, no. HP, email (opsional tapi disarankan — dipakai membuat akun ORANG_TUA saat konversi). → **Lanjut**
5. **Langkah 4 — Dokumen**: untuk tiap jenis dokumen (wajib ditandai), **Pilih File** sesuai format/ukuran yang diizinkan → **Upload** → tunggu centang hijau.
   - Uji negatif: coba file format salah (mis. `.exe`) → error "Format tidak didukung"; file > maxSizeMb → error ukuran.
   - ⚠️ **Gap**: file berhasil ter-upload ke Cloudinary, tetapi **tidak ter-attach ke data pendaftaran** (lihat section 8, gap #1). Lanjutkan test apa adanya.
6. **Langkah 5 — Review**: periksa ringkasan → **Kirim Pendaftaran**.

### A2 — Verifikasi hasil

- [ ] Halaman sukses menampilkan **Nomor Pendaftaran** (format `WW-2026-000001`) — catat nomor ini
- [ ] Buka `/daftar/status` → masukkan nomor → status **Submitted**, program & cabang sesuai
- [ ] (Jika ada kode afiliator diisi) catat untuk smoke test Alur Afiliator — komisi PENDING tercatat

---

## 4. Bagian B — Admin: Verifikasi → Bayar → Konversi

Login admin → menu **PPDB** (`/admin/ppdb`).

- [ ] Daftar pendaftar tampil; chip statistik status bertambah "Submitted: N"
- [ ] Filter/search berfungsi → klik pendaftar → halaman detail

### B1 — Verifikasi

- [ ] Detail: Data Diri, Data Orang Tua, Dokumen, Riwayat Status, tombol aksi sesuai state machine
- [ ] ⚠️ Section **Dokumen (0) — "Tidak ada dokumen diunggah"** → konsekuensi gap #1 (normal saat ini)
- [ ] Klik **→ Menunggu Verifikasi** → status berubah, Riwayat Status bertambah, (notif email/WA terkirim bila terkonfigurasi)
- [ ] Klik **→ Terverifikasi**

### B2 — Bayar

**Jalur standar (offline/manual):**

- [ ] Klik **→ Menunggu Pembayaran**
- [ ] Anggap pendaftar membayar di luar sistem (transfer/cash) → klik **→ Pembayaran Terverifikasi**

**Jalur opsional (payment gateway Duitku, via console browser admin — F12 → Console):**

```js
// 1) Set biaya pendaftaran (belum ada field di UI)
const regId = "<ID_PENDAFTARAN>"; // dari URL /admin/ppdb/[id]
await fetch(`/api/admin/ppdb/${regId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ registrationFee: 150000 }),
}).then(r => r.json());

// 2) Buat link pembayaran Duitku
const co = await fetch(`/api/payments/ppdb/${regId}/checkout`, { method: "POST" }).then(r => r.json());
console.log(co.paymentUrl); // buka di tab pendaftar, bayar (sandbox)
```

- [ ] `paymentStatus` pendaftar jadi PENDING → setelah bayar, **webhook Duitku** set `paymentStatus: PAID` (cek `pm2 logs` / log server untuk callback)
- [ ] Webhook juga otomatis menaikkan status DRAFT/SUBMITTED → WAITING_VERIFICATION (idempotent; status lain tidak diubah — admin tetap memajukan ke PAYMENT_VERIFIED secara manual setelah memastikan pembayaran)

### B3 — Konversi menjadi siswa

1. Klik **→ Diterima** (ACCEPTED).
2. Klik tombol hijau **Konversi ke Siswa Aktif** → konfirmasi.
3. Expected — kartu hijau "Siswa Berhasil Dibuat!" menampilkan **Email + Password sementara**:
   - [ ] Akun **SISWA** dibuat (email pendaftar; bila kosong → email generik `@ww-edu.com`)
   - [ ] Akun **ORANG_TUA** + relasi parent-child dibuat (jika nama & no. HP orang tua terisi)
   - [ ] **Invoice** program dibuat otomatis (jika harga program > 0) — cek Admin → Keuangan
   - [ ] Status → **ACTIVE_STUDENT** (Siswa Aktif) — terminal
   - [ ] (Dengan referral) komisi afiliator naik ke **VALID** — cek modul afiliator
   - [ ] Kredensial & notifikasi terkirim via email/WA (bila terkonfigurasi)
   - [ ] Uji negatif: klik Konversi lagi → ditolak "Pendaftaran ini sudah dikonversi"

> Catatan: auto-enroll kelas saat konversi hanya terjadi jika `preferredClassId` terisi — field ini **belum bisa diisi via UI** (gap #5), jadi penempatan kelas dilakukan manual di Bagian C.

---

## 5. Bagian C — Kelas & Jadwal

### C1 — Login siswa hasil konversi

- [ ] Login `/login` dengan email + password sementara dari B3
- [ ] Dashboard siswa terbuka; `/siswa/materi` masih kosong (belum ter-enroll kelas); `/siswa/jadwal` kosong

### C2 — Admin: masukkan siswa ke kelas

1. Admin → **Kelas & Jadwal** (`/admin/classes`) → buka kelas target (buat dulu bila belum ada: pilih mapel, guru, tipe kelas).
2. Di detail kelas → bagian **Siswa** → tambahkan siswa hasil konversi (cari nama/email).
- [ ] Siswa muncul di daftar siswa kelas

### C3 — Admin: buat jadwal

1. Dari detail kelas → **Jadwal** (`/admin/classes/[id]/schedules`) → tambah jadwal (hari, jam mulai/selesai, ruang bila ada).
- [ ] Minimal 1 jadwal tersimpan

### C4 — Siswa: lihat jadwal & materi

- [ ] Siswa (refresh halaman) → `/siswa/jadwal` → jadwal tampil di kolom hari yang benar (kelas, mapel, guru, jam, ruang)
- [ ] `/siswa/materi` → materi kelas (jika guru sudah upload & publish) tampil

---

## 6. Checklist Ringkas (untuk dicentang saat smoke test)

- [ ] Form `/daftar` 5 langkah lengkap + draft tersimpan (refresh di tengah form → data tetap ada)
- [ ] Upload dokumen: sukses + validasi format/ukuran + rate limit (10 upload/menit)
- [ ] Nomor pendaftaran ter-generate & cek status berfungsi
- [ ] Admin list PPDB: filter, statistik, detail
- [ ] Verifikasi: transisi status sesuai state machine; transisi liar ditolak (coba lompat SUBMITTED → PAYMENT_VERIFIED via tombol — tidak tersedia/tolak)
- [ ] Bayar: transisi manual; (opsional) Duitku checkout + webhook PAID
- [ ] Konversi: akun siswa + ortu + invoice + status ACTIVE_STUDENT + kredensial tampil
- [ ] Kelas: enroll manual via detail kelas
- [ ] Jadwal: buat via admin → tampil di `/siswa/jadwal`
- [ ] Notifikasi status terkirim (cek log/email bila terkonfigurasi)
- [ ] Audit log PPDB tercatat (Admin → Audit Log: CREATE Registration, STATUS_CHANGE, CONVERT_STUDENT)

---

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Form `/daftar` kosong / tidak ada program | belum ada program aktif atau program tidak terhubung cabang | aktifkan program + hubungkan cabang |
| Step Dokumen kosong | belum ada `DocumentType` aktif | insert via SQL/Prisma Studio (section 2.1) |
| Upload dokumen gagal 503 | Cloudinary belum dikonfigurasi | set env `CLOUDINARY_*` lalu restart |
| Upload gagal 429 | rate limit 10 upload/menit per IP | tunggu 1 menit |
| Admin detail: "Tidak ada dokumen diunggah" | **gap #1** — dokumen tidak ter-attach saat submit | lihat section 8; verifikasi dokumen offline sampai gap ditutup |
| Tombol transisi status tidak ada | status terminal (ACTIVE_STUDENT/REJECTED/CANCELLED) atau sudah dikonversi | wajar per state machine |
| Transisi ditolak API | melanggar state machine (`canTransition`) | ikuti urutan status |
| Konversi gagal "sudah dikonversi" | `convertedUserId` sudah terisi | gunakan akun siswa yang sudah dibuat |
| Siswa tidak lihat jadwal | belum di-enroll kelas / kelas belum punya jadwal | selesaikan C2 & C3 |
| Webhook tidak mengubah apa pun | signature Duitku salah / `paymentStatus` sudah PAID (idempotent) | cek `pm2 logs`, pastikan `DUITKU_*` env & callback URL publik |
| Checkout PPDB error "Tidak ada biaya pendaftaran" | `registrationFee` belum di-set | set via PATCH (snippet B2) |

---

## 8. Catatan Gap UI (tindak lanjut disarankan)

1. **Dokumen tidak tersimpan ke pendaftaran** (kritis) — `/api/ppdb/upload` hanya upload ke Cloudinary; `POST /api/ppdb/register` menerima `documentTypeIds` tapi tidak membuat record `RegistrationDocument` (fileUrl hilang). Perbaikan: kirim `documents: [{documentTypeId, fileUrl, name}]` dari form → register API membuat `RegistrationDocument` per item; verifikasi per dokumen di admin (tombol Verifikasi sudah ada).
2. **UI kelola Jenis Dokumen belum ada** — API `/api/admin/document-types` sudah ada; tambahkan tab/section di `/admin/ppdb` (nama, wajib/opsional, ekstensi, maks MB, urutan).
3. **Field Biaya Pendaftaran belum ada di UI** — `PATCH /api/admin/ppdb/[id]` sudah mendukung `registrationFee`; tambahkan input di detail PPDB (muncul saat WAITING_PAYMENT atau kapan saja).
4. **Pembayaran online PPDB belum terhubung UI** — `/api/payments/ppdb/[id]/checkout` berfungsi tapi tidak dipanggil UI mana pun; `returnUrl`-nya menunjuk `/ppdb/status` yang **tidak ada** (harusnya `/daftar/status`). Perbaikan: tombol "Kirim Link Pembayaran" di admin (kirim via WA/email) atau tombol "Bayar" di halaman cek status; perbaiki returnUrl.
5. **`preferredClassId` tidak bisa diisi via UI** — auto-enroll kelas saat konversi tidak pernah terjadi. Perbaikan: dropdown kelas di detail PPDB (opsional, muncul saat ACCEPTED/CLASS_PLACEMENT), atau form pilih kelas pada langkah konversi.
6. **Halaman `/daftar/status` hanya baca** — hanya menampilkan status; sebaiknya saat WAITING_PAYMENT menampilkan status pembayaran + tombol bayar bila gateway aktif (terkait #4).

---

*Dokumen dibuat untuk task smoke test Alur PPDB (timeline-4-minggu.md, Hari 3-4). Setelah semua checklist hijau (dengan penyesuaian gap), tandai task sebagai done di timeline.*
