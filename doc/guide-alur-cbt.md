# Panduan Alur Ujian / CBT (Computer-Based Test)

Panduan end-to-end alur ujian berbasis kode aplikasi saat ini. Berlaku untuk ujian kelas reguler maupun ujian bertipe TOEFL (section + stimulus group).

---

## 1. Ringkasan Alur

```
GURU                                 SISWA                         SISTEM
────                                 ─────                         ──────
Buat ujian (kelas/event)      →  muncul di /siswa/ujian
Tambah section & group (TOEFL) →  (forward-only, timer per section)
Tambah soal / import bank soal →  kerjakan: timer, navigasi, audio
Assign soal ke section/group  →  submit → grading otomatis
Publish (Sembunyikan/Publikasikan)                                 skor % + lulus/tidak
Nilai essay (tab "Nilai Essay")                                    → rekomputasi skor attempt
                                   lulus ≥ KKM                →  trigger e-sertifikat penyelesaian kelas
```

---

## 2. Membuat Ujian (Guru)

Menu: **Guru → Ujian → Buat Ujian** (`/guru/ujian/baru`).

| Field | Keterangan |
|---|---|
| Judul & Deskripsi | Deskripsi tampil sebagai petunjuk pengerjaan di list siswa |
| Terkait dengan | **Kelas** (siswa enrolled kelas) atau **Event/Tryout** (peserta registrasi dengan status bayar PAID/FREE) |
| Lampirkan ke Materi | Opsional; ujian tampil di tab Latihan pada bab materi tsb |
| Durasi | Menit; timer countdown siswa |
| Nilai Lulus (%) | KKM / passing score |
| Maks. Percobaan | 1–10; siswa bisa mengerjakan ulang selama sisa percobaan ada |
| Mulai / Selesai | Jendela pengerjaan. Di luar jadwal: siswa tidak bisa membuka halaman ujian & submit ditolak server |
| Acak urutan soal | Soal diacak setiap kali siswa membuka ujian |
| Mode Skor | SUM/AVG/BEST/LAST — **tersimpan di DB, belum memengaruhi nilai yang ditampilkan** (lihat §9) |

Setelah create, guru diarahkan ke halaman detail ujian. Ujian **belum tampil ke siswa** sampai tombol **Publikasikan** diklik (toggle Publish/Unpublish di kanan atas).

### Kontrol akses (server-side)
- Siswa hanya bisa membuka/mengirim ujian kelas jika ter-enroll di kelas tsb.
- Ujian event hanya untuk peserta terdaftar dengan pembayaran PAID/FREE.
- Validasi dilakukan di halaman take (`/siswa/ujian/[id]`) dan API GET/POST.

---

## 3. Soal

### 3.1 Menambah soal langsung
Tab **Soal** → **Tambah Soal**. Field: tipe, poin, kesulitan, isi soal, gambar soal (upload), audio/video (URL), pilihan + gambar pilihan, kunci, penjelasan.

### 3.2 Import dari Bank Soal
Tab **Soal** → **Pilih dari Bank Soal** → filter (mapel/tipe/level/kata kunci) → pilih → **Tambah**. Soal di-**clone** ke ujian (duplikat konten otomatis dilewati). Perubahan soal ujian tidak memengaruhi bank.

### 3.3 Format kunci jawaban per tipe (penting untuk grading benar)
| Tipe | Format kunci | Grading |
|---|---|---|
| PILGAN | teks pilihan yang benar (persis) | benar/salah |
| PILGAN_KOMPLEK | pilihan benar dipisah `\|`, mis. `A\|C\|D` — **harus teks pilihan**, urutan bebas | benar/salah (semua benar) |
| BENAR_SALAH | `Benar` atau `Salah` | benar/salah |
| ISIAN | jawaban model (exact match) | benar/salah |
| MENGURUTKAN | urutan benar item dipisah koma, mis. `item1,item2,item3` | benar/salah |
| MENJODOHKAN | jawaban kolom kanan berurutan sesuai kolom kiri, dipisah koma | proporsional (benar sebagian = poin proporsional) |
| SETUJU_TIDAK | jawaban per pernyataan dipisah koma, mis. `SETUJU,TIDAK,SETUJU` | proporsional |
| ESSAY | tanpa kunci | dinilai manual guru |

Skor attempt = `round(totalPoinDiperoleh / maxPoin * 100)`.

---

## 4. Ujian TOEFL (Section & Group)

Tab **TOEFL** pada detail ujian.

### 4.1 Section
Batas bagian ujian dengan timer sendiri: **Add Section** → nama (mis. Listening, Structure, Reading), durasi menit, urutan.

### 4.2 Group (stimulus)
**Add Group**:
- **READING**: judul + passage text (tampil di panel stimulus saat siswa mengerjakan soal terkait).
- **AUDIO**: judul + Audio URL (Cloudinary) + opsional **Max Play Count** (batas putar audio) dan Time Limit.

### 4.3 Assign soal ke section/group
- **Form soal baru**: dropdown **Section TOEFL** & **Group Stimulus** (muncul otomatis jika section/group ada).
- **Soal existing**: dropdown assign inline di kartu soal (tab Soal).
- Jika ada section tapi ada soal tanpa section → muncul **peringatan kuning**: soal tanpa section **tidak akan tampil** ke siswa. Assign semua soal sebelum publish.

### 4.4 Perilaku CBT TOEFL di sisi siswa
- **Forward-only**: section sebelumnya terkunci (ikon gembok) — tidak bisa kembali mengubah jawaban.
- **Timer per section**: habis → otomatis lanjut ke section berikutnya (nomor soal reset ke 1); section terakhir habis → auto-submit.
- **Audio group**: max play count di-enforce — setelah limit, audio otomatis di-pause dan tidak bisa diputar lagi.

---

## 5. Mengerjakan Ujian (Siswa)

Halaman: **Siswa → Ujian** (`/siswa/ujian`).

- Badge: Lulus/Tidak Lulus, `Percobaan X/Y` (jika maxAttempts > 1), Kadaluarsa.
- Tombol:
  - **Kerjakan** — belum pernah / masih ada sisa percobaan & dalam jadwal.
  - **Coba Lagi (N tersisa)** — sudah pernah mengerjakan, masih ada sisa percobaan.
  - **Lihat Hasil** — sudah pernah mengerjakan (nilai terakhir ditampilkan di kartu).
- Di halaman ujian: navigasi nomor soal (hijau = terjawab), timer countdown (merah saat < 1 menit), tombol Selesai → konfirmasi → skor & status lulus.
- **Retry**: tombol "Coba Lagi" di halaman hasil mereset seluruh state (jawaban, timer, section, audio count) — attempt baru dengan nomor percobaan berikutnya. Retry hanya muncul jika **belum lulus** dan masih ada sisa percobaan.

---

## 6. Penilaian Essay (Guru)

Tab **Nilai Essay** pada detail ujian (muncul jika ada soal ESSAY):
1. Pilih siswa/attempt.
2. Masukkan skor per soal essay (0–poin soal; dibatasi otomatis).
3. Simpan → skor attempt dihitung ulang dengan grading yang **konsisten** dengan grading submit otomatis (termasuk partial credit MENJODOHKAN/SETUJU_TIDAK/MENGURUTKAN/PILGAN_KOMPLEK).

## 7. Hasil & Statistik (Guru)

Tab **Hasil Ujian**:
- Kartu: jumlah **peserta unik**, rata-rata nilai, lulus (berdasarkan **skor terbaik** tiap siswa).
- Tabel: tiap attempt satu baris; attempt ke-2+ diberi badge `Percobaan #N`.

## 8. Sertifikat Otomatis

Saat siswa submit dengan skor ≥ nilai lulus pada ujian kelas → sistem mengecek kelengkapan seluruh ujian kelas tsb (`checkAndIssueClassCompletionCertificate`). Jika semua syarat terpenuhi, e-sertifikat penyelesaian kelas terbit otomatis. Kegagalan trigger sertifikat **tidak** menggagalkan submit ujian.

## 9. Batasan / Catatan Teknis

- **Mode Skor (SUM/AVG/BEST/LAST)** tersimpan tapi belum memengaruhi nilai tampil; list siswa selalu menampilkan nilai attempt terakhir, statistik guru memakai skor terbaik untuk status lulus.
- **Shuffle opsi pilihan ganda** didukung engine grading & halaman siswa, tapi belum ada checkbox-nya di form buat ujian (default off).
- **Timer & max play count di-enforce di client**. Submit lewat API tetap divalidasi akses, jadwal, dan max attempts di server, namun **durasi pengerjaan tidak dibatasi server** (satu attempt tidak tersimpan state in-progress; refresh halaman mengembalikan halaman hasil jika attempt terakhir completed).
- Ujian tanpa section → semua soal tampil linear satu halaman navigasi.
- Soal dengan `maxPlayCount`/`timeLimit` di **level group**; `timeLimit` group belum dipakai sebagai timer terpisah.

## 10. Smoke Test Manual (5 menit)

1. Guru: buat ujian kelas, durasi 2 menit, KKM 50, maks percobaan 2.
2. Tab TOEFL: buat 2 section (1 menit masing-masing) + 1 group AUDIO (max play 2).
3. Tab Soal: tambahkan 2 PILGAN (assign section-1) + 1 PILGAN (section-2, group audio) + 1 ESSAY.
4. **Publikasikan**.
5. Siswa (enrolled): buka `/siswa/ujian` → Kerjakan → pastikan: badge percobaan, timer section, section terkunci setelah lanjut, audio berhenti setelah 2x putar, auto-advance section.
6. Submit → cek skor & tombol "Coba Lagi (1 tersisa)" → klik → attempt baru mulai bersih (jawaban kosong, timer penuh).
7. Guru: tab Hasil → 2 baris dengan badge Percobaan #2; tab Nilai Essay → nilai essay → skor attempt terbarui.
