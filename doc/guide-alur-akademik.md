# Panduan Alur Akademik (Jurnal → Raport → Orang Tua → PDF)

Panduan end-to-end alur akademik harian bimbel: tutor mencatat jurnal mengajar → nilai komponen & absensi → generate raport → publish → notifikasi siswa & orang tua → download PDF.

---

## 1. Ringkasan Alur

```
Jurnal Mengajar (tutor)          Nilai Komponen (tutor)         Absensi Siswa (tutor/admin)
      │ auto-verifikasi               │                               │
      ▼ absensi tutor (HADIR)         ▼                               ▼
   Payroll ──────►  GENERATE RAPORT (tutor/admin: pilih kelas, semester, periode opsional, pilih siswa)
                        │ hitung: nilai akhir (rata bobot komponen) + predikat A-E + rekap kehadiran
                        ▼
                   DRAFT → (edit catatan tutor/kepala) → PUBLISH
                        │ notifikasi in-app ke siswa + semua orang tua terlink
                        ▼
         SISWA: /siswa/raport      ORANG TUA: /orangtua/raport
                        │
                        ▼
              Download PDF (pdf-lib) — rekap nilai, kehadiran, catatan, tanda tangan
```

## 2. Jurnal Mengajar (Guru → `/guru/jurnal`)

- Tutor isi per sesi: tanggal, jam, materi, aktivitas, kendala, solusi, jumlah siswa.
- **Auto-verifikasi absensi tutor**: menyimpan jurnal otomatis menandai `TeacherAttendance` HADIR (atau membuat record) untuk tanggal tsb — jadi absensi tutor untuk payroll tidak perlu input ganda.
- Admin akademik/cabang bisa melihat & memverifikasi jurnal lintas kelas (scope cabang).

## 3. Generate Raport (`/guru/raport` atau `/admin/raport`)

- Klik **Generate Raport** → pilih kelas, semester (GANJIL/GENAP), periode (opsional — kosongkan jika tidak pakai periode), tahun ajaran (otomatis mengikuti kelas bila tidak dipilih), lalu centang siswa.
- Nilai akhir = rata-rata tertimbang `GradeComponent` (bobot per komponen); predikat A≥90, B≥80, C≥70, D≥60, else E. Rekap kehadiran dari record absensi siswa kelas tsb.
- **Idempoten**: generate ulang untuk siswa yang sama (kelas+semester+periode sama) akan memperbarui, bukan menduplikasi. Periode kosong dianggap nilai unik tersendiri.
- Draft tersimpan status `DRAFT` — belum terlihat siswa/orang tua.

## 4. Publish & Catatan

- Tombol ✓ **Publikasi** per baris (tutor hanya untuk kelasnya; admin cabang scope cabangnya).
- Catatan Tutor (guru) & Catatan Kepala Bimbel (admin) via tombol edit; kembalikan ke Draft kapan pun.
- Publish → notifikasi in-app otomatis ke siswa dan semua orang tua terhubung.

## 5. Siswa & Orang Tua

- Siswa: `/siswa/raport` — hanya raport `PUBLISHED`, kartu nilai + tombol Download PDF.
- Orang tua: `/orangtua/raport` — semua anak ter-link (via `/orangtua/link-anak`), hanya `PUBLISHED`.
- Guru/API menolak akses silang: guru hanya kelas miliknya; orang tua hanya anaknya; admin cabang hanya cabangnya.

## 6. PDF & Export

- PDF: `/api/raport/{id}/pdf` — A4, identitas siswa/kelas/tutor, tabel rincian komponen+bobot+nilai, nilai akhir & predikat, rekap kehadiran, catatan, dua blok tanda tangan (Tutor & Kepala Bimbel), tanggal cetak & tanggal publish. Kelas tanpa tutor menampilkan "-" (tidak error).
- Export Excel rekap: tombol **Export Excel** (mengikuti filter kelas) — guru hanya data kelasnya, admin cabang scope cabangnya.

## 7. Catatan Teknis

- Nilai komponen diatur di halaman Nilai (GradeComponent per kelas; bobot total sebaiknya 100).
- Raport per (siswa, kelas, semester, periode) — periode null dipisahkan dari periode berisi.
- `ADMIN_KEUANGAN` tidak punya akses raport; `ADMIN_AKADEMIK` akses lintas cabang.

## 8. Smoke Test Manual (5 menit)

1. Guru: isi jurnal satu sesi → cek halaman absensi tutor: status HADIR otomatis ter-verifikasi.
2. Guru: input nilai 2-3 komponen untuk 1 siswa → Generate Raport (periode kosong) → muncul DRAFT; siswa/orang tua **belum** melihat.
3. Edit catatan tutor → Publish → login siswa & orang tua: raport muncul + notifikasi; Download PDF tampil lengkap.
4. Generate ulang siswa yang sama → jumlah raport tidak bertambah, nilai ter-update.
5. Export Excel dari halaman guru → hanya kelas milik guru tsb.
