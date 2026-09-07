# Panduan Alur Rapor & Rubrik Bintang (1-5)

Panduan end-to-end sistem rapor dengan rubrik penilaian bintang: bintang akademik otomatis dari nilai latihan & ujian, penilaian sikap belajar per aspek, kesimpulan sikap, publikasi, hingga tampilan siswa/orang tua dan PDF.

---

## 1. Ringkasan Alur

```
Admin: Atur Rubrik (1x)          Generate Rapor                Tutor/Admin: Nilai Sikap
/admin/raport/rubrik        →    /admin/raport (Generate)  →   ikon pensil di baris rapor
  level bintang + aspek sikap      bintang akademik OTOMATIS     bintang per aspek + catatan
                                     dari nilai akhir              ↓ kesimpulan otomatis
                                                                  (rata-rata berbobot)
                                          ↓
                              PUBLISH → notifikasi siswa & orang tua
                                          ↓
                       Siswa: /siswa/raport   Orang Tua: /orangtua/raport   PDF: /api/raport/[id]/pdf
```

---

## 2. Konsep Rubrik Bintang

Rapor menampilkan dua penilaian berbintang **1-5**:

| Bagian | Sumber Nilai | Siapa Menilai |
|---|---|---|
| **Capaian Akademik** | Otomatis dari nilai akhir (rata bobot komponen latihan & ujian) | Sistem (rubrik rentang nilai) |
| **Sikap dalam Belajar** | Manual per aspek → kesimpulan otomatis (rata-rata berbobot) | Tutor / Admin |

Setiap level bintang punya **kategori** (EXCELLENT, VERY GOOD, GOOD, DEVELOPING, NEED SUPPORT), **rentang nilai**, **deskripsi** (teks penjelasan yang tampil di rapor), dan **warna**. Semua bisa dikustomisasi per lembaga.

### Rubrik Default

| Bintang | Rentang Nilai | Kategori | Makna Singkat |
|---|---|---|---|
| 5 | 90-100 | EXCELLENT | Sangat baik, mandiri, lancar, akurat |
| 4 | 80-89 | VERY GOOD | Sangat baik dengan sedikit kesalahan |
| 3 | 70-79 | GOOD | Cukup baik, butuh beberapa perbaikan |
| 2 | 60-69 | DEVELOPING | Dasar mulai berkembang, butuh bimbingan |
| 1 | 0-59 | NEED SUPPORT | Tahap awal, butuh pendampingan intensif |

### Aspek Sikap Default

- **Kedisiplinan** — ketepatan waktu hadir, mengumpulkan tugas, mengikuti aturan kelas
- **Keaktifan** — keterlibatan dalam diskusi, bertanya, dan menjawab
- **Fokus & Konsentrasi** — mempertahankan perhatian selama sesi belajar
- **Kemandirian** — menyelesaikan tugas tanpa bergantung pada bantuan
- **Kerja Sama** — menghargai teman dan bekerja dalam kelompok

> Rubrik default ter-seed otomatis saat admin pertama kali membuka halaman Rapor (`/admin/raport`) atau via `npm run db:seed`.

---

## 3. Bagian A — Admin: Atur Rubrik (Sekali di Awal)

Menu: **Admin → Rapor → tombol "Atur Rubrik"** (`/admin/raport/rubrik`) — khusus SUPER_ADMIN / ADMIN / ADMIN_AKADEMIK.

### A1. Edit Level Rubrik

- Tab **Rubrik Nilai Akademik** dan **Rubrik Sikap Belajar**
- Ubah: jumlah bintang, nilai minimum/maksimum, kategori, warna, dan deskripsi
- Deskripsi = teks yang otomatis mengisi penjelasan di rapor (tetap bisa diubah per siswa)
- Klik **Simpan** per level; **Hapus** jika level tidak dipakai

### A2. Kelola Aspek Sikap

- Tab **Aspek Sikap**
- Tambah aspek baru (nama, penjelasan, bobot) atau edit/hapus aspek lama
- **Bobot** memengaruhi perhitungan kesimpulan sikap (bobot lebih besar = aspek lebih menentukan)
- Non-aktifkan aspek (uncheck Aktif) untuk menyembunyikannya dari penilaian tanpa menghapus data

---

## 4. Bagian B — Generate Rapor (Bintang Akademik Otomatis)

Menu: **Admin → Rapor** (`/admin/raport`) atau **Guru → Rapor** (`/guru/raport`).

1. Klik **Generate Rapor** → pilih kelas, semester, periode (opsional), tahun ajaran, dan siswa
2. Sistem menghitung nilai akhir (rata-rata berbobot komponen latihan & ujian) + predikat A-E
3. **Bintang & kategori akademik terisi otomatis** dari rubrik sesuai rentang nilai
4. Rapor berstatus **DRAFT** — bintang akademik sudah tampil di daftar rapor

---

## 5. Bagian C — Tutor/Admin: Menilai Sikap Belajar

Di daftar rapor, klik ikon **pensil** (Nilai Sikap & Catatan) pada baris rapor:

### C1. Nilai Akademik (Read-Only)

- Bintang + kategori tampil otomatis — tidak bisa diubah manual (mengikuti rubrik)
- **Penjelasan Nilai Akademik**: kosongkan untuk pakai teks rubrik, atau tulis penjelasan khusus siswa
- Tombol **"Gunakan teks rubrik"** mengisi ulang dari deskripsi rubrik

### C2. Sikap per Aspek

- Setiap aspek sikap punya **picker bintang 1-5** + kategori otomatis
- Klik bintang yang sama dua kali untuk menghapus nilai (aspek kembali belum dinilai)
- **Catatan per aspek** (opsional) — mis. "terlambat mengumpulkan tugas 2x"

### C3. Kesimpulan Sikap Keseluruhan

- **Terisi otomatis** dari rata-rata berbobot aspek yang sudah dinilai (dibulatkan)
- Bisa diubah manual jika tutor ingin penilaian menyeluruh berbeda
- **Penjelasan Sikap**: otomatis terisi dari deskripsi rubrik level kesimpulan — bisa diedit
- **Catatan Sikap** (opsional): hal khusus yang perlu diketahui orang tua

### C4. Catatan Rapor

- **Catatan Tutor** dan **Catatan Kepala Bimbel** (admin) — tampil di rapor siswa & PDF

Klik **Simpan Penilaian**.

---

## 6. Bagian D — Publikasi & Tampilan

1. Klik ikon **centang** (Publikasi) di baris rapor → status berubah **PUBLISHED**
2. Siswa & orang tua otomatis menerima **notifikasi in-app**
3. Siswa melihat rapor di **Siswa → Rapor** (`/siswa/raport`): bintang akademik, sikap + rincian aspek, catatan
4. Orang tua melihat rapor anak di **Orang Tua → Raport** (`/orangtua/raport`)
5. **Download PDF** (`/api/raport/[id]/pdf`): rubrik bintang tercetak — bintang, kategori, deskripsi, rincian aspek sikap, dan catatan
6. Batalkan publikasi (klik ikon **rotate**) → kembali DRAFT, rapor hilang dari tampilan siswa/orang tua

---

## 7. Tips & Best Practices

- **Kustomisasi rubrik sesuai lembaga** — ganti kategori/deskripsi agar sesuai bahasa rapor resmi bimbel (mis. "Sangat Baik" dst.)
- **Nilai aspek secukupnya** — aspek yang tidak dinilai tidak dihitung dalam kesimpulan; kesimpulan hanya muncul jika minimal 1 aspek dinilai
- **Bobot aspek** — beri bobot lebih besar pada aspek yang paling mencerminkan sikap belajar di lembaga Anda (mis. Kedisiplinan 2, lainnya 1)
- **Deskripsi per siswa** — teks rubrik adalah default; personalisasi penjelasan untuk siswa dengan capaian/kebiasaan khusus
- **Rapor lama tetap aman** — rapor yang sudah dipublish tidak berubah saat rubrik diedit; perubahan rubrik hanya berlaku untuk generate/penilaian berikutnya

---

## 8. Referensi Teknis Singkat

- Model: `RubricLevel` (type ACADEMIC/ATTITUDE), `AttitudeAspect`, `RaportAttitude` (nilai per aspek), field rubrik di `Raport`
- Helper: `src/lib/raport-rubric.ts` (match skor → bintang, rata-rata berbobot, auto-seed default)
- API: `PATCH /api/raport/[id]` (nilai sikap per aspek + kesimpulan), `GET /api/raport/[id]` (rapor + rubrik), CRUD `/api/admin/rubrik`
- Penilaian disimpan sebagai upsert — mengedit ulang tidak menduplikasi data
