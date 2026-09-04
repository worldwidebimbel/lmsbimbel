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
- [ ] **Jenis Dokumen (DocumentType) aktif** — dikelola via UI di menu PPDB (lihat 2.1)
- [ ] **Cloudinary terkonfigurasi** (env `CLOUDINARY_*`) — tanpa ini upload dokumen gagal 503 "Layanan upload belum dikonfigurasi"
- [ ] **Kelas tersedia** untuk penempatan siswa (Admin → **Kelas & Jadwal**) dengan mapel & guru pengampu — kelas aktif di cabang pendaftar otomatis muncul di dropdown **Kelas Tujuan** detail PPDB
- [ ] (Opsional, hanya jika ingin test pembayaran online) **Duitku terkonfigurasi** (sandbox OK)
- [ ] Browser 2 jendela: satu sebagai admin, satu sebagai pendaftar publik (incognito)

### 2.1 Kelola Jenis Dokumen (via UI, sekali saja jika belum ada)

Admin → menu **PPDB** (`/admin/ppdb`) → section **Jenis Dokumen Pendaftaran** (di bawah daftar pendaftar) → tombol **+ Tambah**. Contoh data uji:

| Nama | Format (pisah koma) | Maks MB | Wajib | Urutan |
|---|---|---|---|---|
| `Pas Foto 3x4` | `jpg,jpeg,png` | 2 | ✔ | 1 |
| `Kartu Keluarga` | `pdf,jpg,jpeg,png` | 5 | ✔ | 2 |
| `Rapor Semester Terakhir` | `pdf` | 5 | ✘ | 3 |

- Tombol **Edit** (ikon pensil) mengubah field yang sama; **Nonaktifkan/Aktifkan** mengatur muncul-tidaknya di form `/daftar` (data lama tetap tersimpan); **Hapus** ditolak (409) jika sudah dipakai pendaftaran — nonaktifkan saja.
- Jenis dokumen nonaktif tidak muncul di langkah Dokumen form `/daftar`.

---

## 3. Bagian A — Pendaftar: Daftar + Upload Dokumen

Jendela incognito (tanpa login).

### A1 — Buka form & isi 5 langkah

1. Buka `/daftar` (bisa juga dari landing page → tombol CTA "Daftar").
2. **Langkah 1 — Program**: pilih program (harga tampil) → pilih cabang yang tersedia untuk program itu. → **Lanjut**
3. **Langkah 2 — Data Diri**: nama lengkap, tempat & tanggal lahir, jenis kelamin, (opsional: NIK, asal sekolah, kelas, alamat, WhatsApp, email). → **Lanjut**
   - Isi **email + WhatsApp** (dipakai untuk notifikasi & kredensial akun nanti).
4. **Langkah 3 — Orang Tua**: nama orang tua, no. HP, email (opsional tapi disarankan — dipakai membuat akun ORANG_TUA saat konversi). → **Lanjut**
5. **Langkah 4 — Dokumen**: untuk tiap jenis dokumen (wajib ditandai), **Pilih File** sesuai format/ukuran yang diizinkan → tunggu centang hijau "Terunggah".
   - Uji negatif: coba file format salah (mis. `.exe`) → error "Format tidak didukung"; file > maxSizeMb → error ukuran.
   - Uji negatif: lanjut tanpa upload dokumen wajib → submit ditolak dengan pesan "Dokumen wajib belum diunggah: ..." dan form melompat kembali ke langkah Dokumen.
   - File yang ter-upload otomatis ter-attach ke pendaftaran saat submit (record `RegistrationDocument` dibuat per dokumen).
6. **Langkah 5 — Review**: periksa ringkasan → **Kirim Pendaftaran**.

### A2 — Verifikasi hasil

- [ ] Halaman sukses menampilkan **Nomor Pendaftaran** (format `WW-2026-000001`) — catat nomor ini
- [ ] Tombol **Cek Status** di halaman sukses langsung membuka `/daftar/status?no=WW-...` dengan nomor terisi otomatis → status **Submitted**, program & cabang sesuai
- [ ] (Jika ada kode afiliator diisi) catat untuk smoke test Alur Afiliator — komisi PENDING tercatat

---

## 4. Bagian B — Admin: Verifikasi → Bayar → Konversi

Login admin → menu **PPDB** (`/admin/ppdb`).

- [ ] Daftar pendaftar tampil; chip statistik status bertambah "Submitted: N"
- [ ] Filter/search berfungsi → klik pendaftar → halaman detail

### B1 — Verifikasi

- [ ] Detail: Data Diri, Data Orang Tua, **Dokumen (N)** dengan file hasil upload pendaftar, Riwayat Status, tombol aksi sesuai state machine
- [ ] Section **Dokumen**: tiap dokumen punya link **Lihat** (file Cloudinary) dan tombol **Verifikasi** — klik Verifikasi pada dokumen yang sesuai → badge "Terverifikasi"
- [ ] Klik **→ Menunggu Verifikasi** → status berubah, Riwayat Status bertambah, (notif email/WA terkirim bila terkonfigurasi)
- [ ] Klik **→ Terverifikasi**

### B2 — Bayar

**Set biaya & buat link pembayaran — semua via UI di detail PPDB:**

1. Di halaman detail pendaftar, cari kartu **Biaya & Pembayaran** (sidebar kanan):
   - Input **Biaya Pendaftaran (Rp)** → isi (mis. `150000`) → **Simpan**.
   - Klik **Buat Link Pembayaran (Duitku)** → link pembayaran muncul dengan tombol **Salin Link** / **Buka**. Kirim link ke pendaftar via WhatsApp/email.
   - Status pembayaran pendaftar berubah **Belum Bayar → Menunggu Konfirmasi** (PENDING).
2. Di jendela pendaftar: buka `/daftar/status?no=WW-...` → baris **Biaya Pendaftaran** + **Pembayaran** tampil → klik **Bayar Sekarang** → diarahkan ke halaman checkout Duitku → bayar (sandbox).
3. Setelah bayar: **webhook Duitku** men-set `paymentStatus: PAID` (cek `pm2 logs` untuk callback); pendaftar yang kembali dari checkout diarahkan ke `/daftar/status?no=...&payment=done` (banner hijau).

**Jalur alternatif (offline/manual — tanpa gateway):**

- [ ] Klik **→ Menunggu Pembayaran** → anggap pendaftar membayar di luar sistem (transfer/cash) → klik **→ Pembayaran Terverifikasi**
- Bila gateway belum dikonfigurasi, tombol Bayar Sekarang menampilkan pesan error "Payment gateway belum dikonfigurasi" — gunakan jalur manual.

- [ ] Webhook juga otomatis menaikkan status DRAFT/SUBMITTED → WAITING_VERIFICATION (idempotent; status lain tidak diubah — admin tetap memajukan ke PAYMENT_VERIFIED secara manual setelah memastikan pembayaran)

### B3 — Pilih kelas tujuan & konversi menjadi siswa

1. (Sebelum konversi) Di kartu **Kelas Tujuan** (sidebar kanan detail PPDB): pilih kelas dari dropdown (kelas aktif cabang pendaftar; label `Nama · Mapel (Guru)`) → **Simpan Kelas Tujuan**. Langkah ini opsional tapi memicu **auto-enroll saat konversi**.
2. Klik **→ Diterima** (ACCEPTED).
3. Klik tombol hijau **Konversi ke Siswa Aktif** → konfirmasi.
4. Expected — kartu hijau "Siswa Berhasil Dibuat!" menampilkan **Email + Password sementara**:
   - [ ] Akun **SISWA** dibuat (email pendaftar; bila kosong → email generik `@ww-edu.com`)
   - [ ] Akun **ORANG_TUA** + relasi parent-child dibuat (jika nama & no. HP orang tua terisi)
   - [ ] **Invoice** program dibuat otomatis (jika harga program > 0) — cek Admin → Keuangan
   - [ ] Bila **Kelas Tujuan** dipilih: siswa **otomatis ter-enroll** di kelas tsb (cek detail kelas → Siswa)
   - [ ] Status → **ACTIVE_STUDENT** (Siswa Aktif) — terminal
   - [ ] (Dengan referral) komisi afiliator naik ke **VALID** — cek modul afiliator
   - [ ] Kredensial & notifikasi terkirim via email/WA (bila terkonfigurasi)
   - [ ] Uji negatif: klik Konversi lagi → ditolak "Pendaftaran ini sudah dikonversi"

---

## 5. Bagian C — Kelas & Jadwal

### C1 — Login siswa hasil konversi

- [ ] Login `/login` dengan email + password sementara dari B3
- [ ] Dashboard siswa terbuka
- [ ] Bila **Kelas Tujuan** dipilih di B3: `/siswa/materi` sudah menampilkan materi kelas tsb (bila guru sudah publish) — lanjut langsung ke C3 untuk verifikasi jadwal
- [ ] Bila tidak: `/siswa/materi` masih kosong → lanjut ke C2 (enroll manual)

### C2 — Admin: masukkan siswa ke kelas (bila tidak memakai Kelas Tujuan)

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
- [ ] Upload dokumen: sukses + validasi format/ukuran + rate limit (10 upload/menit) + dokumen wajib di-enforce saat submit
- [ ] Nomor pendaftaran ter-generate & cek status berfungsi (tombol Cek Status auto-terisi)
- [ ] Admin list PPDB: filter, statistik, detail + kelola Jenis Dokumen (tambah/edit/nonaktif)
- [ ] Verifikasi: dokumen tampil & bisa diverifikasi per item; transisi status sesuai state machine; transisi liar ditolak
- [ ] Bayar: set biaya via UI + Buat Link Pembayaran + Bayar Sekarang di `/daftar/status` + webhook PAID (opsional gateway); jalur manual tetap berfungsi
- [ ] Kelas Tujuan: dropdown kelas aktif cabang + simpan → auto-enroll saat konversi
- [ ] Konversi: akun siswa + ortu + invoice + status ACTIVE_STUDENT + kredensial tampil
- [ ] Kelas: auto-enroll (via Kelas Tujuan) atau manual via detail kelas
- [ ] Jadwal: buat via admin → tampil di `/siswa/jadwal`
- [ ] Notifikasi status terkirim (cek log/email bila terkonfigurasi)
- [ ] Audit log PPDB tercatat (Admin → Audit Log: CREATE Registration, STATUS_CHANGE, CONVERT_STUDENT, UPDATE Registration)

---

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Form `/daftar` kosong / tidak ada program | belum ada program aktif atau program tidak terhubung cabang | aktifkan program + hubungkan cabang |
| Step Dokumen kosong | belum ada `DocumentType` aktif | tambah/nonaktifkan lewat UI PPDB → Jenis Dokumen (section 2.1) |
| Upload dokumen gagal 503 | Cloudinary belum dikonfigurasi | set env `CLOUDINARY_*` lalu restart |
| Upload gagal 429 | rate limit 10 upload/menit per IP | tunggu 1 menit |
| Admin detail: "Tidak ada dokumen diunggah" | pendaftar tidak upload apa pun saat daftar (mis. lewat draft lama) | minta pendaftar kirim dokumen via WhatsApp, atau uji ulang dengan pendaftaran baru |
| Tombol transisi status tidak ada | status terminal (ACTIVE_STUDENT/REJECTED/CANCELLED) atau sudah dikonversi | wajar per state machine |
| Transisi ditolak API | melanggar state machine (`canTransition`) | ikuti urutan status |
| Konversi gagal "sudah dikonversi" | `convertedUserId` sudah terisi | gunakan akun siswa yang sudah dibuat |
| Dropdown Kelas Tujuan kosong | belum ada kelas aktif di cabang pendaftar (atau pendaftar tanpa cabang — menampilkan semua kelas aktif) | buat kelas aktif di cabang tsb |
| Siswa tidak lihat jadwal | belum di-enroll kelas / kelas belum punya jadwal | set Kelas Tujuan sebelum konversi, atau selesaikan C2 & C3 |
| Webhook tidak mengubah apa pun | signature Duitku salah / `paymentStatus` sudah PAID (idempotent) | cek `pm2 logs`, pastikan `DUITKU_*` env & callback URL publik |
| Tombol Buat Link Pembayaran / Bayar Sekarang error "Tidak ada biaya pendaftaran" | `registrationFee` belum di-set/0 | isi Biaya Pendaftaran di kartu Biaya & Pembayaran → Simpan |
| Tombol Bayar Sekarang error "Payment gateway belum dikonfigurasi" | env `DUITKU_*` belum diset | set env Duitku atau gunakan jalur bayar manual |

---

## 8. Catatan Gap UI — Semua Sudah Ditutup ✅

1. ~~Dokumen tidak tersimpan ke pendaftaran~~ — **✅ FIXED**: form `/daftar` mengirim `documents: [{documentTypeId, fileUrl, name}]` saat submit → `POST /api/ppdb/register` membuat record `RegistrationDocument` per dokumen; dokumen wajib di-enforce di form sebelum submit; dokumen tampil & dapat diverifikasi per item di detail admin PPDB.
2. ~~UI kelola Jenis Dokumen belum ada~~ — **✅ FIXED**: section **Jenis Dokumen Pendaftaran** di `/admin/ppdb` (tambah/edit/nonaktifkan/hapus dengan proteksi 409 bila dipakai pendaftaran) via `GET/POST /api/admin/document-types` + `PATCH/DELETE /api/admin/document-types/[id]`.
3. ~~Field Biaya Pendaftaran belum ada di UI~~ — **✅ FIXED**: kartu **Biaya & Pembayaran** di detail PPDB (input biaya + Simpan + badge status pembayaran).
4. ~~Pembayaran online PPDB belum terhubung UI~~ — **✅ FIXED**: tombol **Buat Link Pembayaran (Duitku)** + Salin/Buka di kartu Biaya & Pembayaran; `returnUrl` diperbaiki ke `/daftar/status?no=...&payment=done`.
5. ~~`preferredClassId` tidak bisa diisi via UI~~ — **✅ FIXED**: kartu **Kelas Tujuan** di detail PPDB (dropdown kelas aktif cabang pendaftar, `PATCH /api/admin/ppdb/[id]` menerima `preferredClassId`) → auto-enroll saat konversi.
6. ~~Halaman `/daftar/status` hanya baca~~ — **✅ FIXED**: menampilkan Biaya Pendaftaran + status pembayaran (Belum Bayar/Menunggu Konfirmasi/Lunas) + tombol **Bayar Sekarang** (checkout Duitku) bila fee ter-set dan belum lunas; mendukung prefill nomor via `?no=` dan banner sukses `?payment=done`.

---

*Dokumen dibuat untuk task smoke test Alur PPDB (timeline-4-minggu.md, Hari 3-4). Semua gap UI pada section 8 telah ditutup — jalankan smoke test dengan checklist penuh, lalu tandai task sebagai done di timeline.*
