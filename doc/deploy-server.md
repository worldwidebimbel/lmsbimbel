# Panduan Deploy LMS Bimbel ke VPS IDCloudHost

**Domain:** lmsbimbel.digsan.id  
**IP VPS:** 103.172.204.160  
**Provider:** [console.idcloudhost.com](https://console.idcloudhost.com)  
**Repo:** https://github.com/digsanid-26/lmsbimbel

---
## Push Git manual :

```bash
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
npm run build 2>&1 | Select-String "Type error|error TS|Failed" | Select-Object -First 5

cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
git add -A; git commit -m "feat: grafik bar chart nilai siswa (Recharts) + Modul 16 docs"; git push origin main

npm run build 2>&1 | Select-String "Route" | Select-Object -Last 1

cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel; npm run build 2>&1 | Select-String "error TS|Type error|Failed"

cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel; npm run build 2>&1 | Select-String "Type error|error TS|Failed" | Select-Object -First 10
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
git add -A; git commit -m "chore: add source_files to gitignore"; git push origin main
```

## 1. Akses VPS via SSH

Dari terminal lokal:

```bash
ssh root@103.172.204.160
```

> Jika menggunakan key SSH:
> ```bash
> ssh -i ~/.ssh/id_rsa root@103.172.204.160
> ```

---

## 2. Update System & Install Dependencies

```bash
apt update && apt upgrade -y
```

### Install Node.js 20 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # pastikan v20.x
npm -v
```

### Install PM2 (process manager)
```bash
npm install -g pm2
```

### Install Git
```bash
apt install git -y
```

### Install Nginx
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

---

## 3. Setup PostgreSQL

```bash
apt install postgresql postgresql-contrib -y
systemctl enable postgresql
systemctl start postgresql
```

### Buat user dan database
```bash
sudo -u postgres psql
```

Di dalam psql:
```sql
CREATE USER lmsuser WITH PASSWORD 'GantiPasswordKuat123!';
CREATE DATABASE lmsbimbel OWNER lmsuser;
GRANT ALL PRIVILEGES ON DATABASE lmsbimbel TO lmsuser;
\q
```

### Test koneksi
```bash
psql -U lmsuser -d lmsbimbel -h localhost
```

---

## 4. Clone Repository dari GitHub (Deploy Key)

Karena repo **private**, gunakan **Deploy Key** (SSH) — lebih aman dari PAT karena terbatas satu repo dan tidak perlu menyimpan password.

### 4a. Generate SSH key di VPS

```bash
ssh-keygen -t ed25519 -C "deploy@lmsbimbel-vps" -f ~/.ssh/lmsbimbel_deploy -N ""
cat ~/.ssh/lmsbimbel_deploy.pub
```

Salin output public key (`ssh-ed25519 AAAA...`).

### 4b. Tambahkan ke GitHub Deploy Keys

1. Buka https://github.com/digsanid-26/lmsbimbel/settings/keys
2. Klik **Add deploy key**
3. Title: `VPS IDCloudHost`
4. Key: paste public key dari langkah di atas
5. **Allow write access**: ❌ (read-only cukup)
6. Klik **Add key**

### 4c. Konfigurasi SSH agar pakai key ini

```bash
cat >> ~/.ssh/config << 'EOF'
Host github-lms
  HostName github.com
  User git
  IdentityFile ~/.ssh/lmsbimbel_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

### 4d. Test koneksi & clone

```bash
ssh -T github-lms
# Expected: Hi digsanid-26/lmsbimbel! You've successfully authenticated...

sudo mkdir -p /var/www/lms-bimbel
sudo chown -R lmsbimbel:lmsbimbel /var/www/lms-bimbel
git clone github-lms:digsanid-26/lmsbimbel /var/www/lms-bimbel
cd /var/www/lms-bimbel
```

### 4e. Update remote untuk `git pull` berikutnya

```bash
git remote set-url origin github-lms:digsanid-26/lmsbimbel
```

> **Catatan CI/CD:** GitHub Actions menggunakan secret `SSH_PRIVATE_KEY` yang sudah dikonfigurasi di workflow — tidak perlu deploy key yang sama. Deploy key ini hanya untuk akses manual di VPS.

---

## 5. Konfigurasi Environment Variables

```bash
cp .env.example .env.local
nano .env.local
```

Isi `.env.local` dengan nilai production:

```env
DATABASE_URL="postgresql://lmsuser:Digsan_160626@localhost:5432/lmsbimbel"

NEXTAUTH_URL="https://lmsbimbel.digsan.id"
NEXTAUTH_SECRET="isi-dengan-random-string-32-karakter"

GOOGLE_CLIENT_ID="isi-dari-google-console"
GOOGLE_CLIENT_SECRET="isi-dari-google-console"

# Email via Resend (opsi termudah, cukup API key)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM="EduBimbel <no-reply@namadomain.com>"

NEXT_PUBLIC_APP_URL="https://lmsbimbel.digsan.id"
NEXT_PUBLIC_APP_NAME="EduBimbel LMS"
```

> Generate NEXTAUTH_SECRET:
> ```bash
> openssl rand -base64 32
> ```

---

## 6. Install Dependencies & Build

```bash
npm install
```

### Prisma Generate

`prisma generate` membutuhkan download binary engine dari `binaries.prisma.sh`. Jika VPS memblokir koneksi tersebut, cek dulu:

```bash
curl -I https://binaries.prisma.sh
```

**Jika berhasil (HTTP 200/301):**
```bash
npx prisma generate
```

**Jika gagal / timeout** — gunakan engine yang sudah ada di `node_modules`:

```bash
# Cari engine binary yang sudah ada setelah npm install
ENGINE=$(find /var/www/lms-bimbel/node_modules -name "libquery_engine-debian-openssl-3.0.x.so.node" 2>/dev/null | head -1)

# Jika ditemukan, set env var lalu generate
PRISMA_QUERY_ENGINE_LIBRARY="$ENGINE" npx prisma generate

# Jika tidak ditemukan, buka port outbound terlebih dahulu:
sudo ufw allow out 443/tcp
sudo ufw reload
npx prisma generate
```

> **Catatan:** `schema.prisma` sudah dikonfigurasi dengan `binaryTargets = ["native", "debian-openssl-3.0.x"]` sehingga binary untuk Ubuntu 22.04 akan di-include saat `npm install`.

### Database & Build

```bash
npx prisma migrate deploy
npm run db:seed
npm run build
```

> ⚠️ **Penting:** Sejak Tahap 0, deploy menggunakan `prisma migrate deploy` (bukan `db push`). Pastikan folder `prisma/migrations/` selalu di-commit ke git. Lihat `doc/timeline-4-minggu.md` Tahap 0 untuk detail.

> `db:seed` akan membuat:
> - Semua feature flags
> - Mata pelajaran default
> - Akun demo (admin, guru, siswa, orang tua)

---

## 7. Jalankan dengan PM2

```bash
pm2 start npm --name lms-bimbel -- start
pm2 save
pm2 startup
```

> Perintah `pm2 startup` akan menampilkan satu baris perintah yang harus dijalankan agar PM2 auto-start saat reboot — **jalankan perintah tersebut**.

### Cek status
```bash
pm2 status
pm2 logs lms-bimbel
```

---

## 8. Konfigurasi Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/lmsbimbel
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name lmsbimbel.digsan.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan dan test:

```bash
ln -s /etc/nginx/sites-available/lmsbimbel /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 9. Setup SSL dengan Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d lmsbimbel.digsan.id
```

Ikuti instruksi di layar. Certbot akan otomatis:
- Generate sertifikat SSL
- Update konfigurasi Nginx untuk HTTPS
- Setup auto-renewal

Test auto-renewal:
```bash
certbot renew --dry-run
```

---

## 10. Update DNS di IDCloudHost

1. Login ke [console.idcloudhost.com](https://console.idcloudhost.com)
2. Buka menu **Domains** → pilih domain `digsan.id`
3. Buka tab **DNS Management**
4. Pastikan ada record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | lmsbimbel | 103.172.204.160 | 3600 |

> Propagasi DNS bisa memakan waktu 5–30 menit.

---

## 11. Setup GitHub Actions CI/CD (Opsional)

Agar setiap push ke `main` otomatis deploy ke VPS, tambahkan **Secrets** di GitHub repo:

1. Buka repo → **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret** dan tambahkan:

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | `postgresql://lmsuser:password@localhost:5432/lmsbimbel` |
| `NEXTAUTH_SECRET` | random string 32 karakter |
| `NEXTAUTH_URL` | `https://lmsbimbel.digsan.id` |
| `NEXT_PUBLIC_APP_URL` | `https://lmsbimbel.digsan.id` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | isi dengan **private key** SSH (isi seluruh konten `~/.ssh/id_rsa`) |

### Generate SSH Key untuk CI/CD
Di VPS:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # copy isi ini ke GitHub Secret VPS_SSH_KEY
```

---

## 12. Verifikasi Final

```bash
# Cek app berjalan
pm2 status

# Cek Nginx
systemctl status nginx

# Cek SSL
curl -I https://lmsbimbel.digsan.id

# Cek log app
pm2 logs lms-bimbel --lines 50
```

Akses di browser: **https://lmsbimbel.digsan.id**

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| App tidak bisa start | Cek `pm2 logs lms-bimbel` untuk error |
| 502 Bad Gateway | Pastikan app berjalan di port 3000: `pm2 status` |
| SSL tidak aktif | Jalankan ulang `certbot --nginx -d lmsbimbel.digsan.id` |
| DB connection error | Cek `DATABASE_URL` di `.env.local` sudah benar |
| Setelah git pull tidak update | Jalankan `npm run build` lalu `pm2 restart lms-bimbel` |

### Update Manual (tanpa CI/CD)
```bash
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
git pull && npm run build && pm2 restart lms-bimbel
git add -A; git commit -m "fix: allow public access to landing page (/) without auth"; git push origin main

cd /var/www/lms-bimbel
git pull origin main
npm install
npm run build
pm2 restart lms-bimbel

git checkout -- package-lock.json && git pull origin main
npm install          # nodemailer sudah v7.0.7, tidak ada error
npx prisma generate  # regenerate client
npx prisma migrate deploy  # jalankan semua migration yang belum di-applied

npm run db:seed                  # seed flag FEAT_MULTI_BRANCH + default cabang
npm run db:seed:default-branch  # assign default cabang ke data lama

npm run build
pm2 restart lms-bimbel

git pull && npm install && npx prisma generate && npm run build && pm2 restart lms-bimbel
git pull && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart lms-bimbel
```

> **Jika build gagal** dengan error `Cannot find module '.../jest-worker/processChild.js'` atau sejenisnya, lakukan clean install:
> ```bash
> rm -rf node_modules .next
> npm install
> npx prisma generate
> npm run build
> pm2 restart lms-bimbel
> ```

## Cara setup Gmail OAuth2 di server
### Redirect URI yang harus didaftarkan di Google Cloud

Karena aplikasi ini pakai **satu Google Client ID** untuk login OAuth dan Gmail OAuth2, daftarkan semua redirect URI yang dipakai (WAJIB exact match):

- Login OAuth: `https://[domain-produksi]/api/auth/callback/google`
- Gmail OAuth2: `https://[domain-produksi]/api/admin/email/callback`
- Localhost: `http://localhost:3000/api/auth/callback/google` dan `http://localhost:3000/api/admin/email/callback`

```bash
# Tahap 1 (sebelum otorisasi)
GOOGLE_CLIENT_ID=1234...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Tahap 2 (setelah klik "Mulai Otorisasi" di /admin/settings → Email)
GOOGLE_REFRESH_TOKEN=1//0g...
GMAIL_FROM=akungmail@gmail.com
```

### Troubleshooting

- **redirect_uri_mismatch**: pastikan URI di Google Cloud Console sama persis (https vs http, tanpa trailing slash).
- **Tidak ada refresh_token**: cabut akses app di https://myaccount.google.com/permissions lalu otorisasi ulang.
- **Test email gagal**: cek dulu `/api/admin/email/diagnose` untuk status kredensial.