# Panduan Deploy LMS Bimbel ke Server Baru (digsan.study)

**Domain:** digsan.study  
**IP Server:** 157.10.161.234  
**Repo:** https://github.com/digsanid-26/lmsbimbel  
**Branch deploy:** `feat/worldwide-upgrade` (atau `main` sesuai stabil terbaru)

> Dokumen ini berisi instruksi lengkap untuk deploy aplikasi LMS Bimbel ke server baru dengan domain `digsan.study`. Dapat juga digunakan sebagai template panduan bila akan membuat website baru dengan domain lain — cukup ganti **domain**, **IP server**, dan **nama database** sesuai kebutuhan.

---

## Push Git Manual (dari lokal)

```powershell
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel

# Typecheck cepat
npm run build 2>&1 | Select-String "Type error|error TS|Failed" | Select-Object -First 10

# Commit & push
git add -A; git commit -m "feat: deskripsi commit"; git push origin feat/worldwide-upgrade
```

---

## 1. Akses Server via SSH

Dari terminal lokal:

```bash
ssh root@157.10.161.234
```

> Jika menggunakan key SSH:
> ```bash
> ssh -i ~/.ssh/id_rsa root@157.10.161.234
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
CREATE USER lmsuser WITH PASSWORD 'DigsanStudy123!';
CREATE DATABASE lmsbimbel OWNER lmsuser;
GRANT ALL PRIVILEGES ON DATABASE lmsbimbel TO lmsuser;
\q
```

> Jika membuat website baru dengan nama berbeda, ganti `lmsbimbel` dengan nama database baru, misalnya `digsanstudy`.

### Test koneksi
```bash
psql -U lmsuser -d lmsbimbel -h localhost
```

---

## 4. Clone Repository dari GitHub (Deploy Key)

Karena repo **private**, gunakan **Deploy Key** (SSH) — lebih aman dari PAT karena terbatas satu repo dan tidak perlu menyimpan password.

### 4a. Generate SSH key di server

```bash
ssh-keygen -t ed25519 -C "deploy@digsanstudy" -f ~/.ssh/lmsbimbel_deploy -N ""
cat ~/.ssh/lmsbimbel_deploy.pub
```

Salin output public key (`ssh-ed25519 AAAA...`).

### 4b. Tambahkan ke GitHub Deploy Keys

1. Buka https://github.com/digsanid-26/lmsbimbel/settings/keys
2. Klik **Add deploy key**
3. Title: `Server digsan.study`
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
sudo chown -R $USER:$USER /var/www/lms-bimbel
git clone github-lms:digsanid-26/lmsbimbel /var/www/lms-bimbel
cd /var/www/lms-bimbel
```

### 4e. Update remote untuk `git pull` berikutnya

```bash
git remote set-url origin github-lms:digsanid-26/lmsbimbel
```

> **Catatan CI/CD:** GitHub Actions menggunakan secret `SSH_PRIVATE_KEY` yang sudah dikonfigurasi di workflow — tidak perlu deploy key yang sama. Deploy key ini hanya untuk akses manual di server.

---

## 5. Konfigurasi Environment Variables

```bash
cp .env.example .env.local
nano .env.local
```

Isi `.env.local` dengan nilai production:

```env
DATABASE_URL="postgresql://lmsuser:GantiPasswordKuat123!@localhost:5432/lmsbimbel"

NEXTAUTH_URL="https://digsan.study"
NEXTAUTH_SECRET="isi-dengan-random-string-32-karakter"

GOOGLE_CLIENT_ID="isi-dari-google-console"
GOOGLE_CLIENT_SECRET="isi-dari-google-console"

# Email via Resend (opsi termudah, cukup API key)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM="LMS Bimbel <no-reply@digsan.study>"

NEXT_PUBLIC_APP_URL="https://digsan.study"
NEXT_PUBLIC_APP_NAME="LMS Bimbel"
```

> Generate NEXTAUTH_SECRET:
> ```bash
> openssl rand -base64 32
> ```

> ⚠️ **Penting untuk domain baru:** Daftarkan redirect URI baru di Google Cloud Console:
> - Login OAuth: `https://digsan.study/api/auth/callback/google`
> - Gmail OAuth2: `https://digsan.study/api/admin/email/callback`

---

## 6. Install Dependencies & Build

```bash
npm install
```

### Prisma Generate

`prisma generate` membutuhkan download binary engine dari `binaries.prisma.sh`. Jika server memblokir koneksi tersebut, cek dulu:

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

> ⚠️ **Penting:** Deploy menggunakan `prisma migrate deploy` (bukan `db push`). Pastikan folder `prisma/migrations/` selalu di-commit ke git.

> `db:seed` akan membuat:
> - Semua feature flags
> - Mata pelajaran default
> - Akun demo (admin, guru, siswa, orang tua)

> Jika database masih kosong (server baru, belum ada migration baseline):
> ```bash
> # 1. Buat folder migration baseline
> mkdir -p prisma/migrations/0_init
>
> # 2. Generate SQL dari schema saat ini
> npx prisma migrate diff \
>   --from-empty \
>   --to-schema-datamodel prisma/schema.prisma \
>   --script > prisma/migrations/0_init/migration.sql
>
> # 3. Tandai migration sebagai sudah di-applied (tanpa eksekusi SQL)
> npx prisma migrate resolve --applied 0_init
>
> # 4. Verifikasi
> npx prisma migrate status
> ```

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
nano /etc/nginx/sites-available/digsanstudy
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name digsan.study www.digsan.study;

    client_max_body_size 50M;

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
ln -s /etc/nginx/sites-available/digsanstudy /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 9. Setup SSL dengan Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d digsan.study -d www.digsan.study
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

## 10. Setup DNS

Arahkan domain `digsan.study` ke IP server `157.10.161.234`.

### Jika DNS dikelola di IDCloudHost:
1. Login ke [console.idcloudhost.com](https://console.idcloudhost.com)
2. Buka menu **Domains** → pilih domain `digsan.study`
3. Buka tab **DNS Management**
4. Tambahkan record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 157.10.161.234 | 3600 |
| A | www | 157.10.161.234 | 3600 |

### Jika DNS dikelola di registrar lain (Cloudflare, Namecheap, dll):
1. Login ke dashboard DNS registrar
2. Tambahkan A record:
   - `@` → `157.10.161.234`
   - `www` → `157.10.161.234`
3. Pastikan proxy/CDN (jika Cloudflare) dalam mode **DNS only** (grey cloud) saat setup SSL, bisa diaktifkan proxy (orange cloud) setelah SSL berjalan.

> Propagasi DNS bisa memakan waktu 5–30 menit. Cek dengan:
> ```bash
> dig digsan.study +short
> # atau
> nslookup digsan.study
> ```

---

## 11. Setup GitHub Actions CI/CD (Opsional)

Agar setiap push ke branch deploy otomatis deploy ke server, tambahkan **Secrets** di GitHub repo:

1. Buka repo → **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret** dan tambahkan:

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | `postgresql://lmsuser:password@localhost:5432/lmsbimbel` |
| `NEXTAUTH_SECRET` | random string 32 karakter |
| `NEXTAUTH_URL` | `https://digsan.study` |
| `NEXT_PUBLIC_APP_URL` | `https://digsan.study` |
| `VPS_USER` | `root` |
| `VPS_HOST` | `157.10.161.234` |
| `VPS_SSH_KEY` | isi dengan **private key** SSH (isi seluruh konten `~/.ssh/id_rsa`) |

### Generate SSH Key untuk CI/CD
Di server:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # copy isi ini ke GitHub Secret VPS_SSH_KEY
```

> ⚠️ Jika server lama (lmsbimbel.digsan.id) dan server baru (digsan.study) berjalan paralel, buat workflow terpisah atau gunakan environment selector di GitHub Actions agar deploy ke server yang benar.

---

## 12. Verifikasi Final

```bash
# Cek app berjalan
pm2 status

# Cek Nginx
systemctl status nginx

# Cek SSL
curl -I https://digsan.study

# Cek log app
pm2 logs lms-bimbel --lines 50
```

Akses di browser: **https://digsan.study**

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| App tidak bisa start | Cek `pm2 logs lms-bimbel` untuk error |
| 502 Bad Gateway | Pastikan app berjalan di port 3000: `pm2 status` |
| SSL tidak aktif | Pastikan DNS sudah mengarah ke IP server, lalu jalankan `certbot --nginx -d digsan.study` |
| DB connection error | Cek `DATABASE_URL` di `.env.local` sudah benar |
| Setelah git pull tidak update | Jalankan `npm run build` lalu `pm2 restart lms-bimbel` |
| redirect_uri_mismatch (Google OAuth) | Daftarkan `https://digsan.study/api/auth/callback/google` di Google Cloud Console |

### Update Manual (tanpa CI/CD)

Dari lokal:
```powershell
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
git add -A; git commit -m "fix: deskripsi"; git push origin feat/worldwide-upgrade
```

Di server:
```bash
cd /var/www/lms-bimbel
git pull origin feat/worldwide-upgrade
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart lms-bimbel --update-env
```

Atau satu baris:
```bash
cd /var/www/lms-bimbel && git pull origin feat/worldwide-upgrade && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart lms-bimbel --update-env
```
Bila lama tidak diupdate (package-lock.json di server berubah — error "local changes would be overwritten"):
```bash
cd /var/www/lms-bimbel && git checkout -- package-lock.json && git pull origin feat/worldwide-upgrade && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 restart lms-bimbel --update-env
```

> **Jika pull ditolak**: `error: Your local changes to the following files would be overwritten by merge: package-lock.json` — lockfile di server ditulis ulang oleh `npm install` (versi npm berbeda). Buang perubahan lokal lalu pull:
> ```bash
> git checkout -- package-lock.json
> git pull origin feat/worldwide-upgrade
> ```
> Jika masih ada file lain yang termodifikasi, cek `git status`, lalu `git stash && git pull ... && git stash drop`.
> **Pencegahan permanen**: pakai `npm ci` (bukan `npm install`) di server produksi — tidak pernah menulis ulang `package-lock.json`.

> **Jika build gagal** dengan error `Cannot find module '.../jest-worker/processChild.js'` atau sejenisnya, lakukan clean install:
> ```bash
> rm -rf node_modules .next
> npm install
> npx prisma generate
> npm run build
> pm2 restart lms-bimbel
> ```

---

## Setup Gmail OAuth2 di Server Baru

### Redirect URI yang harus didaftarkan di Google Cloud

Karena aplikasi ini pakai **satu Google Client ID** untuk login OAuth dan Gmail OAuth2, daftarkan semua redirect URI yang dipakai (WAJIB exact match):

- Login OAuth: `https://digsan.study/api/auth/callback/google`
- Gmail OAuth2: `https://digsan.study/api/admin/email/callback`
- Localhost: `http://localhost:3000/api/auth/callback/google` dan `http://localhost:3000/api/admin/email/callback`

```bash
# Tahap 1 (sebelum otorisasi)
GOOGLE_CLIENT_ID=1234...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# Tahap 2 (setelah klik "Mulai Otorisasi" di /admin/settings → Email)
GOOGLE_REFRESH_TOKEN=1//0g...
GMAIL_FROM=akungmail@gmail.com
```

### Troubleshooting Gmail

- **redirect_uri_mismatch**: pastikan URI di Google Cloud Console sama persis (https vs http, tanpa trailing slash).
- **Tidak ada refresh_token**: cabut akses app di https://myaccount.google.com/permissions lalu otorisasi ulang.
- **Test email gagal**: cek dulu `/api/admin/email/diagnose` untuk status kredensial.

---

## Panduan Recovery: Server Terhenti & Error "Client-side exception"

### Gejala

Server sempat berhenti (reboot, PM2 crash, OOM, dll). Setelah start ulang, halaman menampilkan:

> **Application error: a client-side exception has occurred while loading digsan.study (see the browser console for more information).**

### Langkah Recovery (Urut dari Cepat ke Menyeluruh)

#### Langkah 1: Cek status dasar (30 detik)

```bash
pm2 status
pm2 logs lms-bimbel --lines 30 --err
systemctl status postgresql
ss -tlnp | grep 3000
```

#### Langkah 2: Restart cepat (1 menit)

```bash
cd /var/www/lms-bimbel
cat .env.local | grep DATABASE_URL
npx prisma generate
pm2 restart lms-bimbel --update-env
sleep 10 && pm2 logs lms-bimbel --lines 10
```

#### Langkah 3: Rebuild jika Langkah 2 tidak cukup (3-5 menit)

```bash
cd /var/www/lms-bimbel
pm2 stop lms-bimbel
rm -rf .next
npx prisma generate
npm run build
pm2 restart lms-bimbel --update-env
pm2 logs lms-bimbel --lines 20
```

#### Langkah 4: Clean install jika Langkah 3 gagal (5-10 menit)

```bash
cd /var/www/lms-bimbel
pm2 stop lms-bimbel
cp .env.local /tmp/.env.local.backup
rm -rf node_modules .next
npm install
cp /tmp/.env.local.backup .env.local
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart lms-bimbel --update-env
sleep 10 && pm2 logs lms-bimbel --lines 20
```

#### Langkah 5: Cek database jika masih error

```bash
psql -U lmsuser -d lmsbimbel -h localhost -c "SELECT 1;"
systemctl restart postgresql
sleep 5
pm2 logs lms-bimbel --lines 30 | grep -i "database\|prisma\|connection"
```

### Verifikasi Setelah Recovery

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://digsan.study
# Expected: 200

pm2 logs lms-bimbel --lines 10 --err
# Expected: (kosong)
```

### Pencegahan

- **PM2 auto-restart:** pastikan `pm2 startup` sudah dijalankan
- **Save PM2 list:** jalankan `pm2 save` setelah konfigurasi stabil
- **Max memory restart:**
  ```bash
  pm2 restart lms-bimbel --max-memory-restart 500M
  pm2 save
  ```
- **Backup .env.local:**
  ```bash
  cp /var/www/lms-bimbel/.env.local /root/.env.local.backup
  ```

---

## Checklist Deploy Server Baru

- [ ] SSH bisa akses ke `root@157.10.161.234`
- [ ] Node.js 20, PM2, Git, Nginx terinstall
- [ ] PostgreSQL berjalan, database & user dibuat
- [ ] Deploy key ditambahkan ke GitHub
- [ ] Repo berhasil di-clone ke `/var/www/lms-bimbel`
- [ ] `.env.local` terisi dengan benar (URL = `https://digsan.study`)
- [ ] `npm install` berhasil
- [ ] `npx prisma generate` berhasil
- [ ] `npx prisma migrate deploy` berhasil
- [ ] `npm run db:seed` berhasil
- [ ] `npm run build` berhasil
- [ ] PM2 menjalankan app di port 3000
- [ ] Nginx reverse proxy aktif
- [ ] DNS `digsan.study` → `157.10.161.234` sudah propagasi
- [ ] SSL Let's Encrypt aktif (`https://digsan.study`)
- [ ] Google OAuth redirect URI sudah didaftarkan untuk domain baru
- [ ] Verifikasi: `curl -I https://digsan.study` mengembalikan 200
- [ ] Login admin bisa diakses di `https://digsan.study/admin`
