# Panduan Alur Payroll Tutor (Absensi → Generate → Approve → Slip PDF)

Panduan end-to-end penggajian tutor: absensi terdata otomatis → hitung honor per periode → approval → slip honor PDF + export.

---

## 1. Ringkasan Alur

```
Jurnal Mengajar (tutor isi per sesi)  ──auto──►  TeacherAttendance HADIR terverifikasi
Absensi manual (admin)  ──input────►  TeacherAttendance (HADIR/TERLAMBAT/SAKIT/IZIN/ALPHA)
                                             │
                                             ▼
        GENERATE PAYROLL (Admin → Tutor → Payroll): pilih tutor + rentang tanggal + rate
        total = pertemuan × rate/pertemuan + jam × rate/jam  (HADIR & TERLAMBAT dihitung)
                                             │  status DRAFT
                                             ▼
        APPROVE (Setujui) ──► approvedBy/approvedAt + notifikasi ke tutor
                                             │
                                             ▼
        TANDAI DIBAYAR ──► paidAt + notifikasi  ──►  Slip PDF / Export Excel
```

## 2. Sumber Absensi

- **Otomatis**: setiap jurnal mengajar tersimpan, absensi tutor tanggal tsb otomatis HADIR terverifikasi (atau dibuat bila belum ada) — tanpa input ganda.
- **Manual**: Admin → Tutor → Absensi (admin cabang scope cabangnya; satu record per tutor per tanggal).

## 3. Generate Payroll (`/admin/tutor/payroll`)

- Tombol **Generate Payroll** → pilih tutor, rentang tanggal (periode), rate per pertemian &/atau per jam.
- Yang dihitung: jumlah record absensi HADIR/TERLAMBAT dalam periode + total jam (check-out − check-in).
- **Idempoten**: generate ulang periode yang sama memperbarui DRAFT yang ada (tidak dobel). Periode yang sudah APPROVED/PAID ditolak/dilewati.
- Bulk: `POST /api/admin/payroll/generate` (array teacherIds) — sama aturannya.
- Payroll lintas cabang: admin cabang hanya cabangnya; SUPER_ADMIN bisa pilih cabang.

## 4. Approval & Pembayaran

- Status: DRAFT → APPROVED → PAID (bisa CANCELLED dari DRAFT/APPROVED).
- **PAID final**: payroll yang sudah dibayar tidak bisa diubah statusnya/dihapus (proteksi data keuangan).
- Approve/bayar → notifikasi in-app ke tutor beserta nominal.

## 5. Slip PDF & Export

- Tombol ikon **download** per baris → `slip-honor-{nama}.pdf`: identitas tutor, cabang, periode, pertemuan, jam, rate, total honor, status, approver, tanggal approve/bayar, catatan.
- Tutor bisa unduh slip miliknya sendiri (via endpoint yang sama — guru hanya diizinkan slip milik dirinya).
- **Export Excel** — rekap semua payroll (scope cabang).

## 6. Smoke Test Manual (5 menit)

1. Guru isi jurnal → admin cek Absensi Tutor: record HADIR muncul terverifikasi.
2. Admin: Generate Payroll rentang minggu ini + rate 50.000/pertemuan → muncul DRAFT dengan jumlah pertemuan sesuai absensi.
3. Generate ulang periode sama → data ter-update, jumlah baris tidak bertambah.
4. Setujui → tandai dibayar → coba ubah status/hapus → ditolak (409).
5. Download slip PDF per baris → semua field terisi; Export Excel → berisi rekap.
