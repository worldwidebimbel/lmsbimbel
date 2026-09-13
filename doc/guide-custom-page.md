# Panduan Custom Page + Section Builder

**Studi kasus: membuat halaman Lowongan Kerja / Karir, lengkap dengan menu navigasinya di header.**

Custom Page adalah halaman institusional yang dibangun dari **section-section siap pakai** (Section Builder) tanpa coding — contoh: Terms & Conditions, Privacy Policy, **Karir/Lowongan Kerja**, dan sebagainya.

Perbedaan dengan Landing Page:

| | Custom Page | Landing Page |
|---|---|---|
| URL | `/p/{slug}` (mis. `/p/karir`) | `/lp/{slug}` (mis. `/lp/promo-ramadan`) |
| Tujuan | Halaman institusional/statis di dalam website | Halaman kampanye/marketing |
| Header & Footer website | Bisa ditampilkan (default: aktif) | Default tersembunyi (halaman mandiri) |
| Section `HEADER` | Tidak tersedia | Tersedia (logo + CTA sendiri) |

---

## 1. Konsep Dasar

- **Akses admin:** Sidebar → **CMS** → **Custom Pages** (`/admin/custom-pages`). Klik **Buat Custom Page** untuk membuat halaman baru.
- **Slug** = akhiran URL, harus unik, gunakan huruf kecil + tanda hubung (mis. `karir`, `syarat-ketentuan`). URL final: `https://domainanda.com/p/karir`.
- **Draft vs Publish:** halaman hanya bisa diakses publik setelah **Simpan & Publikasi**. Tombol **Simpan Draft** menyimpan tanpa mempublikasikan.
- **Tampilan halaman** dikontrol 3 toggle di bagian *Informasi Dasar*:
  - **Tampilkan Judul Halaman (H1)** — judul halaman sebagai heading besar di atas konten. Matikan bila judul sudah ada di section (mis. di dalam HERO).
  - **Tampilkan Header Website** — header lengkap (topbar + logo + menu navigasi).
  - **Tampilkan Footer Website** — footer lengkap (kontak, sosial media, link).
- **SEO:** Meta Title & Meta Description diisi opsional; jika kosong, otomatis pakai Judul halaman.
- **Urutan section** diatur dengan tombol **↑ / ↓**, hapus dengan ikon tempat sampah. Urutan atas ke bawah = urutan tampil di halaman.

---

## 2. Section yang Tersedia

| Section | Fungsi | Field |
|---|---|---|
| **Hero** | Judul besar + CTA di atas halaman (background gradient ungu) | Badge (opsional), BG image URL (opsional), Judul, Subtitle, CTA label, CTA URL |
| **Fitur** (FEATURES) | Grid kartu poin keunggulan | Judul, Subtitle, daftar item (Fitur + Deskripsi) |
| **Testimoni** | Kartu ulasan | Judul, daftar item (Nama, Peran, Testimoni) |
| **FAQ** | Accordion tanya-jawab | Judul, daftar item (Pertanyaan, Jawaban) |
| **CTA** | Banner ajakan bertindak (background ungu) | Judul, Subtitle, CTA label, CTA URL |
| **Content** | Teks bebas rich format (WYSIWYG): paragraf, heading, list, quote, link | Judul (opsional), Konten, Lebar konten (Sempit–Terlebar), warna BG & teks |
| **Form** | Formulir kontak/pendaftaran | Judul form, Subtitle |

> Catatan: field form **tidak bisa diubah** (Nama, No. WhatsApp, Email, "Program yang diminati", Pesan) dan tidak ada upload file. Untuk kebutuhan karir, lihat trik di langkah 2.6 di bawah.

---

## 3. Langkah 1 — Buat Halaman Karir

1. Sidebar → **CMS** → **Custom Pages** → klik **Buat Custom Page**.
2. Isi **Informasi Dasar**:

| Field | Nilai contoh | Keterangan |
|---|---|---|
| Slug | `karir` | URL: `/p/karir` |
| Judul | `Karir` | Tampil sebagai H1 & nama halaman di list |
| Tampilkan Judul Halaman (H1) | ❌ **OFF** | Judul sudah ditangani section HERO |
| Tampilkan Header Website | ✅ ON | Halaman karir bagian dari website utama |
| Tampilkan Footer Website | ✅ ON | |

---

## 4. Langkah 2 — Susun Section

Struktur rekomendasi untuk halaman karir (atas → bawah):

```
HERO      → sambutan + CTA
FEATURES  → "Mengapa bergabung dengan kami"
CONTENT   → daftar lowongan + syarat (WYSIWYG)
FAQ       → pertanyaan seputar rekrutmen
FORM      → form kirim lamaran
```

### 2.1 HERO

Klik tombol **Hero** di Section Builder, lalu isi:

- **Badge:** `We're Hiring!`
- **Judul:** `Berkarya Bersama Kami`
- **Subtitle:** `Bergabunglah dengan tim pendidik yang berdedikasi mencetak generasi berprestasi.`
- **CTA label:** `Hubungi Recruiter`
- **CTA URL:** `https://wa.me/6281234567890` (nomor WhatsApp HRD/personalia)
- **BG image URL:** boleh kosong (gradient default).

### 2.2 FEATURES — "Mengapa Bergabung dengan Kami"

- **Judul:** `Mengapa Bergabung dengan Kami`
- **Subtitle:** `Lebih dari sekadar tempat kerja`
- **Item** (klik *+ Tambah fitur* untuk menambah):

| Fitur | Deskripsi |
|---|---|
| Gaji & Tunjangan Bersaing | Kompensasi sesuai kompetensi plus tunjangan transport & makan siang |
| Pengembangan Profesional | Pelatihan berkala, sertifikasi, dan mentoring dari guru senior |
| Lingkungan Kolaboratif | Tim yang suportif dan budaya saling membantu |
| Jalur Karier Jelas | Kesempatan naik menjadi kepala program hingga manajemen |

### 2.3 CONTENT — Daftar Lowongan (WYSIWYG)

Klik tombol **Content**, lalu:

- **Judul:** `Lowongan Tersedia`
- **Lebar Konten:** `Sedang (max-w-3xl)`
- **Konten** — gunakan editor rich text. Contoh:

```html
<h3>1. Guru Matematika (SMP/SMA)</h3>
<ul>
  <li>Lulusan S1 Pendidikan Matematika / MIPA (IPK min. 3.00)</li>
  <li>Menguasai kurikulum nasional dan metode pengajaran interaktif</li>
  <li>Pengalaman mengajar minimal 1 tahun (fresh graduate berprestasi dipertimbangkan)</li>
</ul>

<h3>2. Admin Bimbel</h3>
<ul>
  <li>D3/S1 semua jurusan</li>
  <li>Mahir mengoperasikan komputer & media sosial</li>
  <li>Komunikatif dan ramah terhadap siswa maupun orang tua</li>
</ul>

<blockquote>Kirim lamaran melalui form di bawah halaman ini atau WhatsApp: 0812-3456-7890</blockquote>
```

> Tips: gunakan tombol **H2/H3** untuk judul posisi, **list** untuk syarat, dan **quote** untuk catatan tambahan.

### 2.4 FAQ

- **Judul:** `Pertanyaan Seputar Rekrutmen`
- **Item:**

| Pertanyaan | Jawaban |
|---|---|
| Bagaimana proses rekrutmennya? | Seleksi admin → tes mengajar/wawancara → trial mengajar → penawaran kerja. |
| Apakah bisa paruh waktu (part-time)? | Bisa. Beberapa posisi guru tersedia untuk slot sore/malam. |
| Kapan posisi ini dibuka? | Rekrutmen dibuka sepanjang tahun; Anda akan dihubungi bila ada lowongan yang cocok. |

### 2.5 (Opsional) TESTIMONIAL & CTA

- **Testimoni:** cuplikan pengalaman guru/tim yang sudah bergabung (Nama: nama guru, Peran: `Guru Fisika`, Testimoni: kesan bekerja).
- **CTA:** Judul `Siap jadi bagian dari kami?`, Subtitle `Kami menantikan lamaran Anda.`, CTA label `Kirim Lamaran`, CTA URL `/p/karir` (tetap di halaman ini, form ada di bawah).

### 2.6 FORM — Kirim Lamaran

- **Judul form:** `Kirim Lamaran`
- **Subtitle:** `Isi form di bawah, tim kami akan menghubungi Anda.`

Field form bersifat tetap. Untuk keperluan karir, gunakan pemetaan berikut dan **jelaskan di subtitle/judul** agar pelamar mengerti:

| Field di form | Diisi pelamar dengan |
|---|---|
| Nama lengkap | Nama pelamar |
| No. WhatsApp | Nomor aktif untuk dihubungi |
| Email (opsional) | Email pelamar |
| Program yang diminati | **Posisi yang dilamar** (mis. "Guru Matematika") |
| Pesan | Pengalaman singkat / link CV & portofolio |

> Karena **tidak ada upload file**, minta pelamar menaruh link CV/LinkedIn di kolom Pesan, atau arahkan pengiriman CV via WhatsApp (lihat CTA di HERO).

---

## 5. Langkah 3 — SEO & Publikasi

1. **SEO (opsional):**
   - Meta Title: `Karir & Lowongan Kerja | Nama Bimbel`
   - Meta Description: `Bergabunglah dengan tim Nama Bimbel. Lihat lowongan guru & admin terbaru.`
2. Klik **Simpan Draft** untuk pratinjau nanti, atau langsung **Simpan & Publikasi**.
3. Halaman live di `https://domainanda.com/p/karir`. Di daftar Custom Pages muncul badge **Published** + link **Lihat**.

---

## 6. Membuat Menu Navigasi di Header

Agar halaman bisa diakses dari header website, tambahkan menu:

1. Sidebar → **CMS** → **Menu** (`/admin/cms/menu`).
2. Klik **Tambah Menu**, isi:
   - **Label:** `KARIR` (huruf kapital mengikuti gaya menu lain: HOME, PROGRAM, dst.)
   - **URL (href):** `/p/karir` — atau klik **Pilih dari daftar halaman** → grup **Custom Pages** → pilih halamannya (label terisi otomatis). *Picker hanya menampilkan halaman yang sudah dipublikasikan.*
   - **Parent Menu:** `— Tidak ada (top level) —` (menu utama) atau pilih menu lain untuk menjadikannya **submenu dropdown** (mis. di bawah `TENTANG KAMI`).
   - **Urutan:** posisi menu (angka kecil = lebih kiri).
   - **Buka di tab baru:** tidak perlu untuk halaman internal.
   - **Aktif:** ✅
3. Klik **Simpan**. Menu langsung tampil di header.

### Mengatur posisi (urutan) menu

- Cara cepat: Sidebar → **CMS** → **Header** → bagian **Menu Builder** → gunakan tombol panah **↑ / ↓** untuk menggeser urutan menu utama.
- Atau ubah angka **Urutan** di form edit menu (CMS → Menu → ikon pensil).

Posisi menu tergantung tipe header (diatur di CMS → **Homepage** → Header Type):

- **Header Default** (Topbar + Mainbar + Bottombar): menu tampil di **Bottom Bar** (baris biru di bawah logo), tampil sebagai dropdown saat hover.
- **Header Simple** (Mainbar only): menu tampil inline di baris utama sebelah tombol WhatsApp.

### Menu tidak muncul? Checklist

| Cek | Cara |
|---|---|
| **Tampilkan Bottom Bar** aktif (header Default) | CMS → **Header** → Layout → *Tampilkan Bottom Bar* = ON. Baris menu ada di bottom bar. |
| Status menu **Aktif** | CMS → Menu → edit menu → Aktif = ON |
| Halaman sudah **Published** | Menu tetap tampil walau halaman draft, tapi link-nya 404 — pastikan sudah **Simpan & Publikasi** |

### Varian: submenu dropdown

Jika karir ingin ditaruh sebagai submenu (contoh di bawah TENTANG KAMI):

1. Pastikan menu `TENTANG KAMI` sudah ada (top level).
2. **Tambah Menu** → Label `KARIR` → URL `/p/karir` → **Parent Menu**: `TENTANG KAMI` → Simpan.
3. Di desktop, `TENTANG KAMI` otomatis mendapat tanda panah dropdown berisi `KARIR`; di mobile muncul bersarang di menu hamburger.

---

## 7. Mengelola Lamaran Masuk

Semua kiriman form (section **Form**) masuk ke:

> Sidebar → **Site Gallery** (`/admin/site`) → tab **Pendaftaran Masuk**

- Menampilkan 50 kiriman terbaru dengan kolom: **Nama, Kontak (WA/email), Program** (= posisi yang dilamar), **Status, Tanggal**.
- **Status** bisa diubah langsung dari tabel: `Baru` → `Dihubungi` → `Terdaftar` / `Ditutup`.
- Kolom **Program** menunjukkan posisi yang dilamar (sesuai pengisian form), sehingga cocok dipakai untuk menyaring posisi.

---

## 8. Tips & Troubleshooting

| Masalah | Solusi |
|---|---|
| Error `Slug sudah digunakan` | Slug harus unik antar Custom Page. Ganti mis. `karir-2026`. |
| Halaman 404 padahal sudah dibuat | Belum **Simpan & Publikasi** (masih Draft). Atau salah URL — cek prefix `/p/`. |
| Halaman tidak muncul di picker menu | Picker hanya menampilkan halaman **Published**. Publikasikan dulu, buka ulang form menu. |
| Judul halaman tampil dobel | Matikan **Tampilkan Judul Halaman (H1)** karena judul sudah ada di section (mis. HERO). |
| Ingin ganti isi halaman | CMS → Custom Pages → ikon pensil → ubah section → **Simpan & Publikasi**. ⚠️ Klik **Simpan Draft** pada halaman yang sudah published justru **meng-unpublish** halaman (langsung 404 untuk pengunjung). |
| Hapus halaman | CMS → Custom Pages → ikon tempat sampah. Menu yang menunjuk ke halaman terhapus **tidak ikut terhapus** — hapus manual di CMS → Menu. |
| Menu terhapus tak sengaja beserta submenunya | Menghapus menu juga menghapus semua submenunya (cascade). Buat ulang menu + submenunya. |
