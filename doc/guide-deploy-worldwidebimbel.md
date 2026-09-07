# Panduan Deploy LMS Bimbel ke Hostinger (Cloud Startup Hosting)

**Hosting:** Cloud Startup Hosting  
**IP Address:** 46.202.137.132  
**Platform:** Hostinger hPanel → Node.js  
**Repo:** https://github.com/digsanid-26/lmsbimbel  

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

2. Navigasi ke folder app:
   ```bash
   cd ~/domains/worldwidebimbel.com/lms-bimbel
   ```

3. Clone repo (jika pertama kali):
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

---

## 5. Environment Variables (.env)

```env
# Database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/uXXXXXX_lmsbimbel"

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

> **Database:** Hostinger Cloud Startup menyediakan **MySQL/MariaDB**. Buat database via hPanel → **Databases → MySQL**. Sesuaikan `DATABASE_URL` dengan kredensial database yang dibuat.

---

## 6. Langkah C — Database Setup

### C1. Buat Database MySQL

1. hPanel → **Hosting → Databases → MySQL**
2. Klik **Create Database**
3. Isi:
   - **Database name:** `uXXXXXX_lmsbimbel`
   - **Username:** auto-generated
   - **Password:** set password kuat
4. Klik **Create**

### C2. Jalankan Migrasi

Via SSH:
```bash
cd ~/domains/worldwidebimbel.com/lms-bimbel
npx prisma migrate deploy
npx prisma db seed
```

> Jika ini deploy pertama dan belum ada migration baseline, jalankan:
> ```bash
> npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
> npx prisma migrate resolve --applied 0_init
> npx prisma migrate deploy
> ```

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

- Pastikan `DATABASE_URL` di `.env` menggunakan host `localhost` (bukan IP eksternal)
- Pastikan database MySQL sudah dibuat dan user punya akses
- Test koneksi: `mysql -u USER -p DATABASE_NAME -h localhost`

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
- **Backup database** — aktifkan auto-backup di hPanel → **Databases → MySQL → Backup**
