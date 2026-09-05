# Panduan Alur Sertifikat (E-Sertifikat)

Panduan end-to-end alur sertifikat: syarat terpenuhi → penerbitan → PDF + QR → download siswa → verifikasi publik. Berlaku untuk 3 jenis sertifikat: **Kelulusan Program (LMS_COMPLETION)**, **Juara Event (EVENT_WINNER)**, **Peserta Event (EVENT_PARTICIPATION)**.

---

## 1. Ringkasan Alur

```
                    TRIGGER OTOMATIS                        MANUAL (ADMIN)
─────────────────────────────────────────────────────────────────────────
LMS_COMPLETION   siswa submit ujian kelas, lulus      POST /api/admin/sertifikat/[id]
                 SEMUA ujian kelas → terbit otomatis   (issue manual by userId)
                 (non-blocking, tidak gagalkan submit)

EVENT_WINNER     tombol "Hitung Ranking & Juara"       — (upsert sinkron dgn ranking)
                 di /admin/events/[id]/sertifikat

EVENT_PARTICIPATION  tombol "Terbitkan Semua" /         —
                 "Terbitkan" per peserta (halaman sama)

Prestasi Level ≥ 3  halaman /siswa/prestasi (XP) →
                 "Sertifikat Kelulusan LMS" sekali saja
                    ↓
PDF + QR   →   siswa download (/siswa/sertifikat)  →   verifikasi publik /sertifikat/[code]
```

## 2. Penerbitan

### 2.1 Kelulusan program (otomatis)
Setiap submit ujian kelas dengan skor ≥ KKM memanggil `checkAndIssueClassCompletionCertificate`:
- Cek **semua** ujian published di kelas tsb sudah lulus (skor attempt terbaik ≥ KKM masing-masing).
- Dedupe: satu sertifikat per siswa per kelas (match judul `Sertifikat Kelulusan — {nama kelas}`).
- Nomor otomatis `CERT/YYYY/MM/0001`, kode verifikasi 12 karakter unik.
- Kegagalan trigger **tidak** menggagalkan submit ujian siswa.

### 2.2 Juara event
Menu: **Admin → Event → (pilih event) → Sertifikat** → tombol **Hitung Ranking & Juara**:
- Ranking dihitung dari attempt ujian event (skor terbaik, tie-break durasi, kriteria bisa diatur per event).
- **Peringkat & nilai disimpan** ke data registrasi peserta (tampil di tabel peserta).
- Sertifikat 3 juara otomatis diterbitkan; hitung ulang = sinkron (juara naik → upgrade type/judul/rank; keluar top-3 → downgrade ke Peserta). Idempoten — tidak pernah dobel per user per event.

### 2.3 Peserta event
Tombol **Terbitkan Semua** (peserta ATTENDED/CONFIRMED) atau **Terbitkan** per baris. Jika peserta sudah punya sertifikat juara → dilewati; jika data rank/score berubah → disinkronkan, bukan didobel.

### 2.4 Issue manual oleh admin
`POST /api/admin/sertifikat/{userId}` — untuk kasus khusus (sertifikat eksternal/penghargaan). Admin cabang dibatasi scope cabangnya untuk sertifikat event.

## 3. PDF & QR

- Download: `/siswa/sertifikat` → tombol **Download PDF** (juga tombol Lihat/Cetak di tab Sertifikat `/siswa/prestasi`).
- PDF digenerate server-side (`pdf-lib`), landscape, dengan border dekoratif, nomor sertifikat, nama penerima, nilai/peringkat (untuk event), tanggal, teks tanda tangan (dari template), dan **QR code** pojok kanan bawah.
- QR menunjuk ke `{NEXT_PUBLIC_APP_URL}/sertifikat/{kode}` — **set `NEXT_PUBLIC_APP_URL` di env produksi**; fallback memakai origin request.
- Teks header/body/footer/tanda tangan mengikuti **template sertifikat** aktif per tipe (Admin → Sertifikat → Template).

## 4. Verifikasi Publik

- Scan QR / buka `https://domain/sertifikat/{kode}` → halaman sertifikat publik (nama, jenis, event, nilai/rank, tanggal, kode verifikasi) — tanpa login.
- Form manual: `https://domain/sertifikat` → input kode → redirect ke halaman sertifikat.
- Kode tidak ditemukan → 404. Setiap sertifikat punya kode unik 12 karakter (tanpa karakter ambigu 0/O/1/I).

## 5. Catatan Teknis

- `certificateNo`: `CERT/…` (LMS & manual), `EVT/…` (event). Kosong hanya pada data lama sebelum fix — PDF fallback menampilkan kode verifikasi.
- Sertifikat prestasi (Level ≥ 3) diterbitkan sekali seumur hidup per siswa; sertifikat kelulusan kelas terbit per kelas yang diselesaikan.
- `EventRegistration.certificateUrl` belum dipakai — verifikasi memakai tabel `Certificate.code`.
- Statistik halaman admin event sertifikat memakai jumlah cert per event.

## 6. Smoke Test Manual (5 menit)

1. **Kelulusan kelas**: siswa lulus semua ujian 1 kelas (ujian terakhir submit) → buka `/siswa/sertifikat` → muncul "Sertifikat Kelulusan — {kelas}" → Download PDF → QR ter-scan → halaman publik tampil.
2. **Event**: admin buka Admin → Event → Sertifikat → **Hitung Ranking & Juara** → toast jumlah juara; tabel peserta menampilkan peringkat → **Terbitkan Semua** → siswa juara punya 1 sertifikat "Juara {n}", peserta lain "Peserta".
3. Hitung ulang ranking setelah koreksi → sertifikat juara berubah rank/type, **tidak dobel**.
4. `/sertifikat` → masukkan kode manual → halaman verifikasi terbuka; kode salah → 404.
