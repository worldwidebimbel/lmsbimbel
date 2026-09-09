# Panduan Deploy LMS Bimbel ke Hostinger (Cloud Startup Hosting)

**Hosting:** Cloud Startup Hosting  
**IP Address:** 46.202.137.132  
**Platform:** Hostinger hPanel → Node.js  
**Database:** Supabase (PostgreSQL managed — Hostinger Cloud Startup tidak menyediakan PostgreSQL, jadi database di-host di Supabase)  
**Repo:** https://github.com/digsanid-26/lmsbimbel  

---

## 0. Catatan Penting: Database di Supabase

Hostinger Cloud Startup hanya menyediakan **MySQL/MariaDB**, sedangkan aplikasi LMS Bimbel menggunakan **PostgreSQL** (via Prisma). Untuk itu, database ditempatkan di **Supabase** (PostgreSQL managed gratis, dengan free tier yang cukup untuk LMS bimbel skala awal).

**Arsitektur:**

```
Browser → Hostinger (Next.js app) → Supabase (PostgreSQL)
                46.202.137.132        aws-0-[region].pooler.supabase.com
```

> Aplikasi dan database berada di server berbeda. Latency-nya kecil (tergantung region Supabase yang dipilih — pilih region terdekat dengan server Hostinger, mis. Singapore / Indonesia jika tersedia). Untuk traffic LMS bimbel, ini tidak signifikan.

**Dampak pada kode aplikasi:** Tidak ada. Cukup ubah `DATABASE_URL` dan `DIRECT_URL` di `.env`. Karena Supabase = PostgreSQL asli, semua query Prisma tetap compatible.

---

---

## 1. Spesifikasi Lingkungan Hostinger

| Item | Detail |
|---|---|
| **Paket** | Cloud Startup Hosting |
| **IP Address** | 46.202.137.132 |
| **Versi Node.js** | 24.x, 22.x, 20.x, 18.x (rekomendasi: **20.x**) |
| **Package Manager** | npm (default), yarn, pnpm |
| **Framework Frontend** | Angular, Astro, Gatsby, **Next.js**, Nitro, Nuxt, Parcel, React, React Router, Svelte, SvelteKit, Vite, Vue.js |
| **Framework Backend** | Astro, Express, Fastify, Hono, NestJS, **Next.js**, Nitro, Nuxt, React Router, SvelteKit |

> Aplikasi LMS Bimbel menggunakan **Next.js (App Router)** — fully supported oleh Hostinger Node.js hosting.

---

## 2. Arsitektur Deploy di Hostinger

```
GitHub Repo (main / feat/worldwide-upgrade)
    ↓ git pull atau auto-deploy
Hostinger hPanel → Node.js App
    ├── Build: npm install && npm run build
    ├── Start: npm start (atau server.js)
    ├── Port: otomatis di-assign oleh Hostinger
    └── Domain: worldwidebimbel.com (atau domain Anda)
         └── Nginx reverse proxy → Node.js app
```

Hostinger Cloud Startup menggunakan **Phusion Passenger** sebagai app server — tidak perlu PM2. Passenger otomatis restart app jika crash dan mengelola process lifecycle.

---

## 3. Langkah A — Setup via hPanel

### A1. Buat Node.js App

1. Login ke **hPanel** → https://hpanel.hostinger.com
2. Buka **Hosting → Advanced → Node.js**
3. Klik **Create Application**
4. Isi form:
   - **Project name:** `lms-bimbel`
   - **Node.js version:** `20.x`
   - **Project directory:** `lms-bimbel` (subfolder di `domains/yourdomain.com/`)
   - **Startup file:** `npm start` (atau `server.js` jika pakai custom start)
   - **Package manager:** `npm`
5. Klik **Create**

### A2. Hubungkan Domain

1. Pastikan domain (mis. `worldwidebimbel.com`) sudah mengarah ke IP `46.202.137.132` (A record di DNS)
2. Di hPanel → **Hosting → Domains** — pastikan domain terdaftar
3. Node.js app otomatis terhubung ke domain utama

### A3. Setup SSL

1. hPanel → **Hosting → Security → SSL**
2. Aktifkan **Free SSL (Let's Encrypt)** untuk domain
3. Aktifkan **Auto-renew**
4. Pastikan HTTPS redirect aktif

---

## 4. Langkah B — Deploy Kode

### B1. Via Git (Manual Pull)

1. SSH ke server Hostinger:
   ```bash
   ssh uXXXXXX@46.202.137.132
   ```
   > Ganti `uXXXXXX` dengan username akun hosting Anda (lihat di hPanel → FTP/SSH Details)

2. **Temukan folder app yang benar:**

   Struktur folder Hostinger Cloud Startup:
   ```
   ~/domains/
     ├── yourdomain.com/        ← folder domain (nama = domain Anda)
     │   ├── public_html/       ← web root (PHP/static files)
     │   └── lmsbimbel-main/    ← folder Node.js app (nama = "Project directory" di hPanel)
     └── subdomain.domain.com/
   ```

   **Cara 1 — via SSH:**
   ```bash
   # Lihat daftar domain yang terdaftar
   ls ~/domains/

   # Lihat isi folder domain Anda
   ls ~/domains/worldwidebimbel.com/

   # Folder app biasanya di dalam folder domain, cek isinya
   ls ~/domains/worldwidebimbel.com/lmsbimbel-main/
   ```
   > Nama folder domain = domain yang Anda daftarkan di hPanel (mis. `worldwidebimbel.com`, `worldwidebimbel.id`, dll.)
   > Nama folder app = "Project directory" yang Anda set saat membuat Node.js app di hPanel

   **Cara 2 — via hPanel (paling akurat):**
   - hPanel → **Advanced → Node.js** → klik app Anda
   - Lihat field **"Project directory"** dan **"Domain"**
   - Path lengkap = `~/domains/[domain]/[project-directory]`
   - Contoh: domain `worldwidebimbel.com`, project directory `lmsbimbel-main` → path = `~/domains/worldwidebimbel.com/lmsbimbel-main`

   **Cara 3 — via hPanel File Manager:**
   - hPanel → **Files → File Manager**
   - Navigasi ke `domains/` → buka folder domain Anda → cari folder app
   - Klik kanan folder → **Info** untuk melihat path lengkap

3. Navigasi ke folder app:
   ```bash
   cd ~/domains/[domain-anda]/[project-directory]
   ```
   Contoh:
   ```bash
   cd ~/domains/worldwidebimbel.com/lmsbimbel-main
   ```

4. Clone repo (jika pertama kali):
   ```bash
   git clone https://github.com/digsanid-26/lmsbimbel.git .
   git checkout feat/worldwide-upgrade
   ```
   Atau pull update:
   ```bash
   git pull origin feat/worldwide-upgrade
   ```

### B2. Install Dependencies & Build

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### B3. Setup Environment Variables

1. Buat file `.env` di root project:
   ```bash
   nano .env
   ```
2. Isi dengan konfigurasi production (lihat section 5 di bawah)
3. Simpan file

### B4. Restart App

Di hPanel → **Node.js** → klik **Restart** pada app `lms-bimbel`

Atau via SSH:
```bash
touch tmp/restart.txt
```

> Hostinger Passenger memantau perubahan pada `tmp/restart.txt` untuk restart aplikasi.

### B5. Alternatif: Deploy via ZIP Upload (Tanpa SSH/Git)

Jika tidak memiliki akses SSH atau akun GitHub tidak bisa dikonfigurasi di server, gunakan metode upload ZIP via hPanel File Manager.

#### Persiapan ZIP di Komputer Lokal

1. Build project di komputer lokal:
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```

2. Buat folder sementara bernama `lmsbimbel-main` (ini akan menjadi root folder di server Hostinger)

3. Salin isi project ke folder `lmsbimbel-main/` — **yang WAJIB disertakan**:
   - `.next/` (hasil build — folder ini penting, jangan dilewati)
   - `public/` (asset statis)
   - `prisma/` (schema + migrations folder)
   - `package.json` dan `package-lock.json`
   - `next.config.mjs` atau `next.config.js`
   - `tsconfig.json`
   - `tailwind.config.ts` (jika ada)
   - `postcss.config.mjs` atau `postcss.config.js` (jika ada)

4. **JANGAN sertakan** (tidak perlu & memperbesar ZIP):
   - `node_modules/`
   - `.env` atau `.env.local` (akan dibuat terpisah di server)
   - `doc/` (dokumentasi internal)
   - `src/` (sudah dikompilasi ke `.next/`)
   - `.git/`

5. Kompres folder `lmsbimbel-main/` menjadi ZIP:
   - Klik kanan folder `lmsbimbel-main` → **Compress to ZIP**
   - Pastikan struktur di dalam ZIP: `lmsbimbel-main/.next/`, `lmsbimbel-main/package.json`, dst.
   - Nama file: `lmsbimbel-deploy.zip`

#### Upload via hPanel File Manager

1. Login ke **hPanel** → **Hosting → Files → File Manager**
2. Navigasi ke: `domains/worldwidebimbel.com/`
3. Upload `lmsbimbel-deploy.zip` ke folder tersebut
4. Klik kanan ZIP → **Extract** → isi nama folder `lmsbimbel-main` jika belum otomatis
5. Verifikasi struktur: `domains/worldwidebimbel.com/lmsbimbel-main/.next/`, `lmsbimbel-main/package.json`, dst.

#### Konfigurasi Node.js App di hPanel

1. hPanel → **Advanced → Node.js** → **Create Application** (atau edit yang sudah ada)
2. Set:
   - **Project directory:** `lmsbimbel-main`
   - **Node.js version:** `20.x`
   - **Startup file:** `npm start`
   - **Package manager:** `npm`
3. Klik **Create** / **Save**

#### Install Dependencies & Setup via hPanel Terminal

1. hPanel → **Node.js** → app `lmsbimbel-main` → klik **Open Terminal** (atau **Run NPM Install**)
2. Jalankan:
   ```bash
   npm install --production=false
   ```
3. Buat file `.env`:
   - Di File Manager, navigasi ke `lmsbimbel-main/`
   - Klik **New File** → nama: `.env`
   - Isi dengan konfigurasi production (lihat section 5)
4. Jalankan migrasi database:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Klik **Restart** di halaman Node.js hPanel

#### Update Selanjutnya via ZIP

Setiap ada update kode:

1. Build ulang di lokal: `npm run build`
2. Salin folder yang berubah (terutama `.next/`, `public/`, `prisma/`, `package.json`) ke `lmsbimbel-main/`
3. Buat ZIP baru
4. Upload via File Manager → Extract (overwrite file lama)
5. Jalankan `npm install` jika ada dependency baru
6. Jalankan `npx prisma migrate deploy` jika ada migration baru
7. **Restart** app di hPanel

> **Tips:** Untuk update kecil (hanya konten/asset), cukup upload file yang berubah tanpa membuat ZIP ulang. Gunakan File Manager → drag & drop file individual.

---

## 5. Environment Variables (.env)

```env
# Database (Supabase PostgreSQL)
# - DATABASE_URL: connection pooler (PgBouncer, port 6543) — untuk runtime app (Next.js)
# - DIRECT_URL: direct connection (port 5432) — untuk Prisma migrate & long-running query
# Ganti [REF], [PASSWORD], [REGION] sesuai project Supabase Anda (lihat section 6)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="https://worldwidebimbel.com"

# Google OAuth (opsional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email/SMTP (opsional)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""

# Payment Gateway (opsional)
DUITKU_MERCHANT_CODE=""
DUITKU_API_KEY=""
DUITKU_WEBHOOK_URL="https://worldwidebimbel.com/api/payments/webhook/duitku"
```

> **Database:** Database ditempatkan di Supabase (PostgreSQL managed), bukan MySQL Hostinger. Buat project Supabase terlebih dahulu (lihat section 6). `DIRECT_URL` wajib diisi karena `schema.prisma` mendeklarasikan `directUrl` untuk migrasi & query yang butuh koneksi langsung.

---

## 6. Langkah C — Database Setup (Supabase)

### C0. Buat Project Supabase

1. Daftar / login di https://supabase.com
2. Klik **New Project**
3. Isi:
   - **Name:** `lms-bimbel` (bebas)
   - **Database Password:** set password kuat — **simpan baik-baik**, password hanya ditampilkan sekali
   - **Region:** pilih terdekat dengan Hostinger (mis. **Southeast Asia (Singapore)** jika available, atau region dengan latency terkecil ke `46.202.137.132`)
   - **Plan:** Free tier (cukup untuk mulai) atau Pro jika butuh uptime SLA
4. Klik **Create new project**, tunggu ±2 menit hingga provisioning selesai

### C1. Ambil Connection String

1. Di dashboard Supabase → **Project Settings** (gear icon) → **Database**
2. Buka bagian **Connection string** — ada beberapa mode:
   - **Transaction pooler** (port `6543`) → untuk `DATABASE_URL` (runtime app)
   - **Session pooler** (port `5432`) → alternatif
   - **Direct connection** (port `5432`) → untuk `DIRECT_URL` (Prisma migrate)
3. Salin masing-masing, ganti `[YOUR-PASSWORD]` dengan password yang dibuat di C0:

```env
# Transaction pooler → DATABASE_URL
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection → DIRECT_URL
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

> `[REF]` adalah project reference Supabase (format `xxxxxxxxxxxxxxxxxxxxx`), ada di **Project Settings → General → Reference ID**.
> `[REGION]` tergantung region yang dipilih (mis. `ap-southeast-1`).

### C2. Aktifkan PgBouncer (Connection Pooling)

Supabase free tier punya batas ~60 koneksi. PgBouncer (sudah aktif default di pooler Supabase) mengelola pool koneksi.

1. Dashboard Supabase → **Project Settings → Database → Connection pooling**
2. Pastikan status: **Enabled**
3. Mode: **Transaction** (cocok untuk Prisma + Next.js serverless-like)
4. Pool size default sudah cukup — tidak perlu ubah

### C3. Jalankan Migrasi (dari server Hostinger via SSH)

```bash
cd ~/domains/worldwidebimbel.com/lms-bimbel
# Pastikan .env sudah berisi DATABASE_URL dan DIRECT_URL dari Supabase
npx prisma migrate deploy
npx prisma db seed
```

> `migrate deploy` otomatis pakai `DIRECT_URL` (direct connection) — penting karena PgBouncer (transaction mode) tidak mendukung `LISTEN/NOTIFY` & prepared statement yang dipakai migrate.
> Jika ini deploy pertama dan belum ada migration baseline di repo, jalankan:
> ```bash
> npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
> npx prisma migrate resolve --applied 0_init
> npx prisma migrate deploy
> ```

### C4. Verifikasi di Supabase Dashboard

1. Supabase → **Table Editor** — pastikan tabel-tabelel LMS sudah terbentuk (User, Cabang, Siswa, Guru, dst.)
2. Cek jumlah record di tabel `User` — harus berisi data seed (mis. akun admin/guru/siswa demo)

### C5. (Opsional) Hardening Supabase

- **Restrict by IP**: Supabase → **Database → Network Restrictions** → izinkan hanya IP `46.202.137.132` (Hostinger). Mencegah akses DB dari luar.
- **Auto-backup**: Free tier backup harian (7 hari). Aktifkan PITR (Point-in-Time Recovery) di Pro plan untuk backup lebih granular.
- **Connection limit monitoring**: Supabase → **Database → Insights** — pantau penggunaan koneksi.

---

## 7. Langkah D — Update Aplikasi (Routine Deploy)

Setiap ada update di repo:

```bash
cd ~/domains/worldwidebimbel.com/lms-bimbel
git pull origin feat/worldwide-upgrade
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
touch tmp/restart.txt
```

Atau satu baris:

```bash
git pull origin feat/worldwide-upgrade && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && touch tmp/restart.txt
```

---

## 8. Troubleshooting

### App tidak muncul / 502 Bad Gateway

- Cek **Node.js version** di hPanel — pastikan `20.x` (bukan 18.x jika ada fitur yang butuh Node 20+)
- Cek **startup file** — pastikan `npm start` atau path `server.js` benar
- Cek log: hPanel → Node.js → **View Logs** atau via SSH `cat ~/domains/worldwidebimbel.com/logs/*.log`

### Database connection error

- Pastikan `DATABASE_URL` (pooler port `6543`) dan `DIRECT_URL` (direct port `5432`) di `.env` sudah benar dan **password** sesuai
- Pastikan project Supabase aktif (tidak di-pause). Free tier bisa pause setelah 1 minggu idle — klik **Restore** di dashboard Supabase
- Cek region: gunakan region Supabase terdekat dengan Hostinger (`46.202.137.132`)
- Test koneksi dari SSH Hostinger:
  ```bash
  npx prisma db execute --schema prisma/schema.prisma --stdin <<< "SELECT 1;"
  ```
- Jika error `prepared statement does not exist` → PgBouncer transaction mode. Solusi: pastikan `DATABASE_URL` pakai `?pgbouncer=true&connection_limit=1`, dan `directUrl` di schema diisi
- Jika error `too many connections` → turunkan `connection_limit` atau upgrade Supabase plan
- Cek status Supabase di https://status.supabase.com

### Build error (memory limit)

- Cloud Startup punya limit memory — jika `npm run build` OOM:
  - Tambah swap: `fallocate -l 1G /tmp/swapfile && chmod 600 /tmp/swapfile && mkswap /tmp/swapfile && swapon /tmp/swapfile`
  - Atau build di lokal lalu upload folder `.next/` via FTP/SFTP

### Prisma migrate error

- Pastikan `prisma/migrations/` folder ikut ter-commit di repo
- Jalankan `npx prisma migrate status` untuk cek state
- Jika ada drift: `npx prisma migrate resolve --applied NAMA_MIGRATION`

### SSL tidak aktif

- Pastikan DNS A record sudah resolve ke `46.202.137.132` (cek: `dig worldwidebimbel.com A`)
- Tunggu propagasi DNS (max 24 jam)
- Re-issue SSL di hPanel → SSL → Re-issue

---

## 9. Checklist Pasca-Deploy

- [ ] Akses `https://worldwidebimbel.com` — halaman landing tampil
- [ ] Login admin (`/admin`) — berhasil
- [ ] Login siswa (`/siswa`) — berhasil
- [ ] Login guru (`/guru`) — berhasil
- [ ] Database terhubung (cek: buat data test di admin)
- [ ] Upload file berfungsi (cek: upload materi/avatar)
- [ ] Email terkirim (jika SMTP dikonfigurasi) — test reset password
- [ ] Payment gateway callback (jika dikonfigurasi) — test sandbox
- [ ] SSL aktif (HTTPS, no warning)
- [ ] Google OAuth login berfungsi (jika dikonfigurasi)

---

## 10. Catatan Penting

- **Tidak perlu PM2** — Hostinger Cloud Startup menggunakan Phusion Passenger yang otomatis mengelola proses Node.js
- **Port otomatis** — Passenger menetapkan port via environment variable `PORT`, tidak perlu set manual
- **`.next/` folder** — harus ada setelah build; jika di-`.gitignore`, pastikan build dijalankan di server
- **File uploads** — pastikan folder `public/uploads/` writable (`chmod -R 755 public/uploads`)
- **Cron jobs** — jika ada scheduled task (mis. cron notifikasi), setup via hPanel → **Advanced → Cron Jobs**
- **Backup database** — database di Supabase, bukan Hostinger. Free tier: backup harian (7 hari). Untuk backup manual: Supabase → **Database → Backups** atau via `pg_dump` dari SSH Hostinger:
  ```bash
  pg_dump "$DIRECT_URL" -F c -f backup.dump
  ```
