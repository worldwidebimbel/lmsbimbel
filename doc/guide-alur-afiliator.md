# Panduan Uji Alur Afiliator (End-to-End)

> Smoke test timeline Hari 3-4: **"Alur Afiliator: klik link → daftar → verifikasi → bayar → komisi VALID → pencairan"** + **"Uji anti-fraud: self-referral ditolak, duplikasi terdeteksi"**.

Tujuan: memverifikasi seluruh rantai referral dari klik link sampai komisi dibayarkan, termasuk state machine komisi, anti-fraud, notifikasi, permission, dan audit log.

**Prasyarat**

- Feature flag **FEAT_AFFILIATE** aktif — cek di `/admin/features` (menu Afiliator muncul di sidebar admin).
- Minimal 1 **program aktif** dengan harga (mis. Rp 300.000) — dipakai untuk menghitung komisi persentase.
- Akun admin (SUPER_ADMIN / ADMIN / ADMIN_KEUANGAN).
- Untuk pembayaran: ikut `doc/guide-alur-ppdb.md` Bagian B2 (Duitku sandbox) atau verifikasi manual.

**Referensi cepat**

- Halaman: `/admin/afiliator` (Kelola) · `/admin/afiliator/referral` · `/admin/afiliator/pencairan` · `/admin/afiliator/aturan-komisi` · `/afiliator` (portal afiliator)
- Link referral publik: `/api/ref/{KODE}` → redirect ke `/daftar` + cookie `ref` (30 hari)
- State machine komisi (Referral & Commission):
  `PENDING → REGISTRATION_VERIFIED → PAYMENT_VERIFIED → VALID → READY_PAYOUT → PAID` (terminal lain: `CANCELLED`)

---

## Bagian 0 — Setup Admin (sekali)

### 0.1 — Buat akun user untuk afiliator

1. Login admin → menu **Pengguna** (`/admin/users`) → **Tambah Pengguna**.
2. Isi Nama, Email (unik), Password (≥8), Role: **Afiliator** → Simpan.

### 0.2 — Buat afiliator & hubungkan akun

1. Menu **Afiliator** (`/admin/afiliator`) → tab **Kelola Afiliator** → **Tambah Afiliator**.
2. Isi: Nama*, WhatsApp*, Email, Kategori (SISWA/ALUMNI/TUTOR/ORANG_TUA/PARTNER/UMUM), Nama Bank + No. Rekening + Atas Nama (untuk pencairan), lalu **Akun user** → pilih akun Afiliator yang dibuat di 0.1.
3. **Simpan** → baris baru muncul dengan **kode unik** format `WW-NAMA01` (auto-generate, tidak bisa diedit), kolom **Akun** menampilkan ikon ✔ hijau (tooltip = email akun).
4. Uji validasi: coba pilih akun user yang sudah terhubung afiliator lain → simpan → error "Akun user sudah terhubung ke afiliator lain" (bukan 500).

- [ ] Akun user AFILIATOR dibuat
- [ ] Afiliator tersimpan; kode `WW-...` muncul; kolom Akun ✔
- [ ] Akun yang sudah dipakai ditolak dengan pesan jelas

### 0.3 — Buat aturan komisi

1. Tab **Aturan Komisi** (`/admin/afiliator/aturan-komisi`) → **Tambah Aturan**.
2. Contoh: Tipe **Persentase**, Program: **Semua Program**, Persentase: `10`, Stage: `REGISTRATION`, Prioritas: `0`, Aktif ✔ → Simpan.
   - Aturan per-program menang atas persentase/nominal; semakin tinggi Prioritas semakin dipilih duluan.
   - Stage `REGISTRATION` = aturan dipakai saat pendaftaran dibuat. Kosongkan Stage untuk berlaku di semua tahap.
3. Alternatif nominal tetap: Tipe **Nominal Tetap**, Nominal: `50000`.

- [ ] Aturan komisi aktif muncul di tabel

---

## Bagian 1 — Afiliator: login & salin link

1. Logout → login sebagai akun afiliator (0.1).
2. Buka `/afiliator` (Portal Afiliator — sidebar khusus role Afiliator).
3. Kartu **Link Referral Anda**: link `/api/ref/{KODE}` + tombol **Copy**; statistik Total Klik / Calon Siswa / Pendaftar / Siswa Aktif dan ringkasan komisi (Total / Pending / Siap Cair / Dibayar) tampil 0.

- [ ] Dashboard afiliator tampil dengan link & kode referral
- [ ] Copy link berfungsi (teks berubah "Tersalin")

---

## Bagian 2 — Publik: klik link → pendaftaran

1. Jendela/incognito baru (tanpa login): buka link referral `/api/ref/{KODE}`.
   - Salah kode / afiliator nonaktif → diarahkan ke `/daftar` tanpa cookie.
2. Terjadi: redirect ke **`/daftar`**, cookie `ref` tersimpan 30 hari, klik terhitung (rate-limit 20 klik/IP/hari — klik ke-21 tidak dihitung).
3. Formulir: pilih program → isi data diri/orang tua/dokumen → di step **Review** muncul **Kode Referral** terisi otomatis.
   - Jika pengunjung datang tanpa link, field "Kode Referral (opsional)" bisa diisi manual di step data diri.
4. Submit → dapat nomor registrasi `WW-PPDB-...`.
5. Balik ke dashboard afiliator → **Total Klik** bertambah; setelah daftar, **Calon Siswa** bertambah; notifikasi "Referral Baru!" + email (bila email terkonfigurasi).

- [ ] Klik link diarahkan ke `/daftar` dan kode referral terisi otomatis
- [ ] Total klik & calon siswa bertambah di dashboard afiliator
- [ ] Notifikasi "Referral Baru!" muncul

## Bagian 3 — Admin: verifikasi → bayar → konversi

Lanjutan `doc/guide-alur-ppdb.md` Bagian B — pantau tab **Referral** (`/admin/afiliator/referral`):

1. Baru mendaftar → status referral **Pending** + kolom Komisi terisi (contoh: 10% × Rp 300.000 = Rp 30.000).
2. Admin verifikasi dokumen → pendaftar **Terverifikasi** → referral **Verifikasi Reg.**
3. Set biaya & pembayaran (link Duitku / invoice) → pendaftar bayar & terkonfirmasi → referral **Verifikasi Bayar**.
4. Konversi (status ACCEPTED/CLASS_PLACEMENT → tombol hijau **Konversi jadi Siswa** di detail PPDB) → referral & komisi jadi **Valid** (validatedAt terisi); afiliator dapat notif "Komisi Aktif".
5. Jika pendaftar **Ditolak/Dibatalkan** → referral & komisi **Dibatalkan**; notif perubahan status ke afiliator.

- [ ] Status referral mengikuti tahapan PPDB: Pending → Verifikasi Reg. → Verifikasi Bayar
- [ ] Konversi → referral **Valid** + notifikasi afiliator
- [ ] Tolak/batalkan → referral **Dibatalkan**

## Bagian 4 — Admin: tandai komisi siap cair

Langkah wajib sebelum afiliator bisa mencairkan komisi:

1. Tab **Referral** → cari baris berstatus **Valid** → klik ikon ✔ hijau (**Tandai siap cair**) → konfirmasi.
2. Status berubah **Siap Cair**; afiliator dapat notif "Komisi: Siap Dicairkan".
3. Tombol hanya muncul untuk status Valid; API menolak status lain (400).

- [ ] Referral Valid → Siap Cair via tombol ✔
- [ ] Notifikasi "Siap Dicairkan" sampai ke afiliator

## Bagian 5 — Afiliator: ajukan pencairan

1. Login afiliator → `/afiliator` → ringkasan **Siap Cair** > 0 → kartu **Ajukan Pencairan** muncul.
2. **Ajukan** → isi nominal (≤ saldo siap cair) → **Kirim Pengajuan** → sukses: halaman reload, **Riwayat Pencairan** bertambah baris **Diajukan**.
3. Uji batas: ajukan nominal > saldo → error "Nominal melebihi komisi tersedia (Rp ...)".
4. Nominal yang diajukan < saldo: hanya komisi secukupnya yang ter-link ke pengajuan.

- [ ] Pengajuan pencairan berhasil (status Diajukan)
- [ ] Nominal melebihi saldo ditolak dengan pesan jelas

## Bagian 6 — Admin: proses pencairan

Tab **Pencairan** (`/admin/afiliator/pencairan`):

1. Baris **Diajukan** → cek data rekening afiliator → ikon ✔ (**Setujui**) → status **Disetujui**.
2. Tombol hijau **Bayar** → (opsional) isi URL bukti transfer di prompt → status **Dibayar** + tanggal bayar; komisi terkait jadi **PAID**; afiliator dapat notif "Sudah Dibayar"; saldo "Dibayar" afiliator bertambah.
3. Uji tolak: pengajuan lain → ikon ✕ (**Tolak**) → status **Ditolak** dan komisi kembali **Valid** (bisa ditandai siap cair lagi).
4. Semua aksi tercatat di audit log (`PAYOUT_APPROVE` / `PAYOUT_PAY` / `PAYOUT_REJECT`, `READY_PAYOUT_REFERRAL`).

- [ ] Setujui → Bayar → status Dibayar; komisi PAID; notif afiliator
- [ ] Tolak → komisi kembali Valid
- [ ] Audit log terisi untuk tiap aksi

## Bagian 7 — Anti-fraud (uji "self-referral ditolak, duplikasi terdeteksi")

Sistem tidak memblokir pendaftaran, tetapi menandai referral **⚠ fraud** + alasan (terlihat di tab Referral admin) — keputusan bayar/tolak di tangan admin.

1. **Self-referral**: login/ambil data email & WhatsApp akun afiliator → daftar via link referral dengan email/WA (atau NIK profil) yang sama → referral muncul dengan ⚠ "Self-referral: data afiliator sama dengan pendaftar".
2. **Duplikasi pendaftar**: daftar lagi via link referral memakai NIK/WA/email yang sudah pernah dipakai pendaftar sebelumnya → ⚠ "Duplikasi akun: NIK/WA/email pendaftar sudah pernah terdaftar".
3. Admin mengarahkan mouse ke ⚠ untuk membaca alasan → **Batalkan referral** (ikon 🚫) → komisi CANCELLED.
4. Referral ganda untuk pendaftaran yang sama oleh afiliator yang sama tidak akan tercatat dobel (unique constraint).

- [ ] Self-referral terdeteksi (⚠ + alasan)
- [ ] Duplikasi NIK/WA/email terdeteksi (⚠ + alasan)
- [ ] Admin bisa membatalkan referral fraud → komisi dibatalkan

## Bagian 8 — Permission & akses

1. Login **ADMIN_CABANG** → menu **Afiliator** tidak tampil; akses langsung `/admin/afiliator` atau `PATCH /api/admin/affiliate/...` → redirect/ditolak (403). Afiliator = ranah ADMIN_KEUANGAN ke atas.
2. User **AFILIATOR** yang belum dihubungkan ke data afiliator → `/afiliator` menampilkan "Akun Anda tidak terdaftar sebagai afiliator." (bukan error 500).
3. Role lain (SISWA/GURU/ORANG_TUA) membuka `/afiliator` → di-redirect ke `/login`.
4. Endpoint publik `/api/ref/{KODE}` tidak membocorkan data afiliator (hanya redirect + cookie).

- [ ] ADMIN_CABANG tidak punya akses modul afiliator (menu & API)
- [ ] Afiliator tanpa data → pesan informatif; role lain ditolak

## Bagian 9 — Data & pelaporan

1. Tab **Referral** → filter chip per status → **Export Excel** mengunduh CSV sesuai filter aktif.
2. Statistik dashboard admin (`/admin`) menyertakan ringkasan afiliator (jika flag aktif).
3. Cek konsistensi angka: Total Komisi = Pending + Siap Cair + Dibayar + (dibatalkan tidak dihitung).

- [ ] Filter + Export Excel bekerja
- [ ] Angka ringkasan konsisten

---

## Bug yang diperbaiki saat smoke test (2026-09-05)

| # | Temuan | Perbaikan |
|---|--------|-----------|
| 1 | **Kritis** — `markReadyPayout()` tidak pernah dipanggil API/UI mana pun; komisi stuck di VALID → afiliator tidak pernah bisa mengajukan pencairan (alur putus) | Action `readyPayout` di `PATCH /api/admin/affiliate/referrals` + tombol ✔ **Tandai siap cair** (tab Referral, status Valid) + audit + notifikasi |
| 2 | **Kritis** — Form Tambah/Edit afiliator tidak punya field `userId` (API menerima tapi UI tidak kirim) → afiliator tidak terhubung akun → portal `/afiliator` 404 → tidak bisa pencairan | Dropdown **Akun user** (role Afiliator) di form + kolom **Akun** di tabel + validasi 409 "akun sudah terhubung" di POST/PATCH |
| 3 | Tidak ada navigasi antar sub-halaman admin afiliator (harus ketik URL manual) | Komponen `AfiliatorNav` (tab Kelola/Referral/Pencairan/Aturan Komisi) di 4 halaman |
| 4 | Minor — link referral dashboard afiliator memakai `window.location.origin` saat render (risiko hydration mismatch); tombol Bayar payout tidak bisa isi bukti transfer | Set origin via `useEffect`; prompt **URL bukti transfer (opsional)** saat Bayar |

## Catatan implementasi

- Komisi **VALID** terjadi saat **konversi jadi siswa aktif** (`CONVERTED`), bukan sekadar pembayaran terverifikasi — siap cair adalah keputusan manual admin (tombol Tandai siap cair) sebagai kontrol fraud terakhir.
- Notifikasi afiliator (in-app + email) hanya terkirim bila affiliate terhubung ke akun user (`userId`).
- Rate limit klik: in-memory per instance (20 klik/IP/hari) — cukup untuk anti-spam ringan, bukan analitik presisi.
