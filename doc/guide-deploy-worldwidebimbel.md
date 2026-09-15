# Panduan Deploy LMS Bimbel ke VPS IDCloudHost (worldwidebimbel.com)

**Domain:** worldwidebimbel.com  
**IP Server:** [IP-VPS-IDCLOUDHOST]  
**Repo:** https://github.com/worldwidebimbel/lmsbimbel (public)  
**Branch deploy:** `feat/worldwide-upgrade` (atau `main` sesuai stabil terbaru)

> Dokumen ini berisi instruksi lengkap untuk deploy aplikasi LMS Bimbel ke VPS IDCloudHost dengan domain `worldwidebimbel.com`. Dapat juga digunakan sebagai template panduan bila akan membuat website baru dengan domain lain — cukup ganti **domain**, **IP server**, dan **nama database** sesuai kebutuhan.
>
> Repo `worldwidebimbel/lmsbimbel` bersifat **public**, jadi tidak perlu deploy key SSH — `git clone` langsung via HTTPS.

---

## Push Git Manual (dari lokal)

```powershell
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel

# Typecheck cepat
npm run build 2>&1 | Select-String "Type error|error TS|Failed" | Select-Object -First 10

# Commit & push
git add -A; git commit -m "feat: deskripsi commit"; git push origin feat/worldwide-upgrade
```

> Repo `worldwidebimbel/lmsbimbel` adalah remote tambahan. Pastikan push ke remote yang benar:
> ```bash
> git remote -v
> # Jika belum ada remote worldwidebimbel:
> git remote add worldwidebimbel https://github.com/worldwidebimbel/lmsbimbel.git
> git push worldwidebimbel feat/worldwide-upgrade
> ```

---

## 1. Akses Server via SSH

Dari terminal lokal:

```bash
ssh root@[IP-VPS-IDCLOUDHOST]
```

> Jika menggunakan key SSH:
> ```bash
> ssh -i ~/.ssh/id_rsa root@[IP-VPS-IDCLOUDHOST]
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

> ⚠️ **Jika nginx gagal start** dengan error `socket() [::]:80 failed (97: Unknown error)`:
> IPv6 tidak di-compile di kernel VM. Hapus baris `listen [::]:80` dari config default:
> ```bash
> sed -i 's/listen \[::\]:80/# listen [::]:80/' /etc/nginx/sites-enabled/default
> sed -i 's/listen \[::\]:80/# listen [::]:80/' /etc/nginx/nginx.conf
> nginx -t
> systemctl start nginx
> dpkg --configure -a
> apt -f install -y
> ```

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
CREATE USER lmsuser WITH PASSWORD 'WorldwideBimbel123!';
CREATE DATABASE worldwidebimbel OWNER lmsuser;
GRANT ALL PRIVILEGES ON DATABASE worldwidebimbel TO lmsuser;
\q
```

> Jika membuat website baru dengan nama berbeda, ganti `worldwidebimbel` dengan nama database baru sesuai kebutuhan.

### Test koneksi
```bash
psql -U lmsuser -d worldwidebimbel -h localhost
```

---

## 4. Clone Repository dari GitHub

Karena repo **public**, tidak perlu deploy key — langsung clone via HTTPS:

```bash
sudo mkdir -p /var/www/lms-bimbel
sudo chown -R $USER:$USER /var/www/lms-bimbel
git clone https://github.com/worldwidebimbel/lmsbimbel.git /var/www/lms-bimbel
cd /var/www/lms-bimbel
git checkout feat/worldwide-upgrade
```

> Jika ingin push dari server (opsional), setup git credentials:
> ```bash
> git config --global user.name "Worldwide Bimbel"
> git config --global user.email "admin@worldwidebimbel.com"
> ```
> Karena repo public, `git pull` tidak butuh autentikasi. `git push` butuh PAT (Personal Access Token) atau SSH key.

---

## 5. Konfigurasi Environment Variables

```bash
cp .env.example .env
nano .env
```

> ⚠️ **Penting:** Prisma CLI (`migrate deploy`, `db:seed`) baca file `.env`, **bukan** `.env`. Jadi buat file `.env` (bukan `.env`) di server produksi. Next.js akan baca `.env` juga (sebagai fallback), jadi cukup satu file.

Isi `.env` dengan nilai production:

```env
# Database (PostgreSQL lokal)
# - DATABASE_URL: dipakai runtime app (PrismaClient query)
# - DIRECT_URL: dipakai Prisma CLI (migrate deploy, db push, studio).
#   WAJIB diisi — schema.prisma mendeklarasikan directUrl.
#   Karena PostgreSQL lokal (tanpa pooler), isi sama dengan DATABASE_URL.
DATABASE_URL="postgresql://lmsuser:WorldwideBimbel123!@localhost:5432/worldwidebimbel"
DIRECT_URL="postgresql://lmsuser:WorldwideBimbel123!@localhost:5432/worldwidebimbel"

NEXTAUTH_URL="https://worldwidebimbel.com"
NEXTAUTH_SECRET="isi-dengan-random-string-32-karakter"

GOOGLE_CLIENT_ID="isi-dari-google-console"
GOOGLE_CLIENT_SECRET="isi-dari-google-console"

# Email via Resend (opsi termudah, cukup API key)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM="Worldwide Bimbel <no-reply@worldwidebimbel.com>"

NEXT_PUBLIC_APP_URL="https://worldwidebimbel.com"
NEXT_PUBLIC_APP_NAME="Worldwide Bimbel"

# ===== AI Builder (lihat doc/guide-ai-builder.md) =====
# Provider teks/soal (wajib minimal 1 untuk AI Builder & AI Question Generator)
# APIClaude.net (default) — dapat dari apiclaude.net
APICLAUDE_API_KEY=""
AI_BASE_URL="https://apiclaude.net/v1"
AI_MODEL="langgananku/claude-sonnet-4-20250514"
# OpenRouter.ai (alternatif/serbaguna — satu key untuk teks, gambar, TTS, video-direct)
OPENROUTER_API_KEY=""
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="anthropic/claude-sonnet-4"
OPENROUTER_SITE_URL="https://worldwidebimbel.com"
OPENROUTER_SITE_NAME="Worldwide Bimbel"

# Provider gambar (Fase 2/2b — kosong = kapabilitas gambar belum aktif)
# Pilih 1: OpenAI Images (default) / Replicate / Stability / OpenRouter (pakai OPENROUTER_API_KEY di atas)
OPENAI_IMAGES_API_KEY=""
# AI_IMAGE_MODEL="gpt-image-1"
REPLICATE_API_KEY=""
STABILITY_API_KEY=""

# Provider TTS (Fase 3 — kosong = kapabilitas audio belum aktif)
# Pilih 1: OpenAI TTS (default) / Google / ElevenLabs / OpenRouter (pakai OPENROUTER_API_KEY di atas)
OPENAI_TTS_API_KEY=""
# AI_TTS_MODEL="gpt-4o-mini-tts"
GOOGLE_TTS_API_KEY=""
ELEVENLABS_API_KEY=""

# Direct video-gen via OpenRouter (Fase 4 premium — pakai OPENROUTER_API_KEY di atas)
# AI_VIDEO_MODEL="google/veo-3.1"
```

> ⚠️ **`DIRECT_URL` wajib diisi.** Jika tidak, `npx prisma migrate deploy` akan error:
> ```
> Environment variable not found: DIRECT_URL
> ```
> Untuk PostgreSQL lokal (tanpa connection pooler seperti PgBouncer/Supabase),
> cukup isi `DIRECT_URL` dengan nilai yang sama dengan `DATABASE_URL`.

> Generate NEXTAUTH_SECRET:
> ```bash
> openssl rand -base64 32
> ```

> ⚠️ **Penting untuk domain baru:** Daftarkan redirect URI baru di Google Cloud Console:
> - Login OAuth: `https://worldwidebimbel.com/api/auth/callback/google`
> - Gmail OAuth2: `https://worldwidebimbel.com/api/admin/email/callback`

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
> - Header config keys
> - Custom pages default (Terms & Privacy draft)

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
nano /etc/nginx/sites-available/worldwidebimbel
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name worldwidebimbel.com www.worldwidebimbel.com;

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

        # AI Builder (generate gambar/TTS/video) bisa makan > 60s.
        # Default Nginx proxy_read_timeout = 60s → 502 Bad Gateway.
        # 300s cukup untuk image gen (10-60s) & TTS (10-30s).
        # Video composite polling terpisah (client poll GET /api/ai/jobs/[id]).
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }
}
```

> **Penting:** Tanpa `client_max_body_size`, nginx default hanya mengizinkan body request **1MB**, menyebabkan error `413 Request Entity Too Large` saat upload file materi (PPT/PDF/video). Batas aplikasi sudah mengizinkan hingga 50MB untuk dokumen/PPT, 100MB untuk video, dan 20MB untuk gambar — pastikan nginx tidak membatasi di bawah itu.

Aktifkan dan test:

```bash
ln -s /etc/nginx/sites-available/worldwidebimbel /etc/nginx/sites-enabled/
# Hapus default site jika konflik
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

## 9. Setup SSL dengan Let's Encrypt

> ⚠️ **Prasyarat:** Pastikan DNS di Cloudflare sudah diset ke **DNS only** (grey cloud) — bukan Proxied (orange cloud). Let's Encrypt perlu akses langsung ke server via HTTP-01 challenge. Setelah SSL terpasang, proxy Cloudflare bisa diaktifkan.

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d worldwidebimbel.com -d www.worldwidebimbel.com
```

Ikuti instruksi di layar. Certbot akan otomatis:
- Generate sertifikat SSL
- Update konfigurasi Nginx untuk HTTPS
- Setup auto-renewal

Test auto-renewal:
```bash
certbot renew --dry-run
```

> Jika certbot gagal dengan error "Connection refused" atau "Timeout":
> 1. Cek DNS sudah pointing ke IP VPS: `dig worldwidebimbel.com +short`
> 2. Pastikan Cloudflare proxy = **DNS only** (grey cloud)
> 3. Pastikan port 80 terbuka: `ufw allow 80/tcp && ufw allow 443/tcp`

---

## 10. Setup DNS di Cloudflare

Domain `worldwidebimbel.com` dikelola via **Cloudflare**.

1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pilih domain `worldwidebimbel.com`
3. Buka tab **DNS → Records**
4. Tambahkan record:

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| A | `@` | [IP-VPS-IDCLOUDHOST] | **DNS only** (grey cloud) | Auto |
| A | `www` | [IP-VPS-IDCLOUDHOST] | **DNS only** (grey cloud) | Auto |

> ⚠️ **Penting — set proxy ke "DNS only" (grey cloud) saat setup SSL.**
> Jika proxy aktif (orange cloud), Cloudflare akan menyediakan SSL sendiri dan Let's Encrypt tidak akan bisa melakukan HTTP-01 challenge. Setelah SSL Let's Encrypt terpasang, proxy bisa diaktifkan (orange cloud) jika ingin fitur CDN/DDoS protection Cloudflare.
>
> **Cara verifikasi DNS sudah pointing benar:**
> ```bash
> dig worldwidebimbel.com +short
> # Expected: [IP-VPS-IDCLOUDHOST]
> ```
>
> Propagasi DNS Cloudflare biasanya cepat (1-5 menit).

### (Opsional) Aktifkan Cloudflare Proxy setelah SSL berjalan

Setelah `https://worldwidebimbel.com` berfungsi dengan SSL Let's Encrypt:

1. Kembali ke Cloudflare DNS Records
2. Ubah proxy status dari **DNS only** → **Proxied** (orange cloud)
3. Cloudflare akan otomatis menyediakan SSL edge certificate
4. Set SSL mode di **SSL/TLS** → **Full (strict)** agar Cloudflare validate cert Let's Encrypt

> **Catatan:** Jika proxy Cloudflare aktif, pastikan Nginx `server_name` menerima koneksi dari IP Cloudflare. Cloudflare mengirim header `CF-Connecting-IP` — bisa dipakai di Nginx untuk mendapat real IP visitor:
> ```nginx
> # Di /etc/nginx/nginx.conf, dalam blok http {}:
> set_real_ip_from 173.245.48.0/20;
> set_real_ip_from 103.21.244.0/22;
> set_real_ip_from 103.22.200.0/22;
> set_real_ip_from 103.31.4.0/22;
> set_real_ip_from 141.101.64.0/18;
> set_real_ip_from 108.162.192.0/18;
> set_real_ip_from 190.93.240.0/20;
> set_real_ip_from 188.114.96.0/20;
> set_real_ip_from 197.234.240.0/22;
> set_real_ip_from 198.41.128.0/17;
> set_real_ip_from 162.158.0.0/15;
> set_real_ip_from 104.16.0.0/13;
> set_real_ip_from 104.24.0.0/14;
> set_real_ip_from 172.64.0.0/13;
> set_real_ip_from 131.0.72.0/22;
> real_ip_header CF-Connecting-IP;
> ```

---

## 11. Setup GitHub Actions CI/CD (Opsional)

Agar setiap push ke branch deploy otomatis deploy ke server, tambahkan **Secrets** di GitHub repo `worldwidebimbel/lmsbimbel`:

1. Buka https://github.com/worldwidebimbel/lmsbimbel/settings/secrets/actions
2. Klik **New repository secret** dan tambahkan:

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | `postgresql://lmsuser:password@localhost:5432/worldwidebimbel` |
| `DIRECT_URL` | sama dengan `DATABASE_URL` (PostgreSQL lokal tanpa pooler) |
| `NEXTAUTH_SECRET` | random string 32 karakter |
| `NEXTAUTH_URL` | `https://worldwidebimbel.com` |
| `NEXT_PUBLIC_APP_URL` | `https://worldwidebimbel.com` |
| `VPS_USER` | `root` |
| `VPS_HOST` | `[IP-VPS-IDCLOUDHOST]` |
| `VPS_SSH_KEY` | isi dengan **private key** SSH (isi seluruh konten `~/.ssh/id_rsa`) |

### Generate SSH Key untuk CI/CD
Di server:
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
curl -I https://worldwidebimbel.com

# Cek log app
pm2 logs lms-bimbel --lines 50
```

Akses di browser: **https://worldwidebimbel.com**

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| App tidak bisa start | Cek `pm2 logs lms-bimbel` untuk error |
| 502 Bad Gateway | Pastikan app berjalan di port 3000: `pm2 status` |
| SSL tidak aktif | Pastikan DNS sudah mengarah ke IP server, lalu jalankan `certbot --nginx -d worldwidebimbel.com` |
| DB connection error | Cek `DATABASE_URL` **dan `DIRECT_URL`** di `.env` sudah benar. Jika error `Environment variable not found: DIRECT_URL`, tambahkan baris `DIRECT_URL=...` (nilai sama dengan `DATABASE_URL` untuk PostgreSQL lokal) |
| Setelah git pull tidak update | Jalankan `npm run build` lalu `pm2 restart lms-bimbel` |
| redirect_uri_mismatch (Google OAuth) | Daftarkan `https://worldwidebimbel.com/api/auth/callback/google` di Google Cloud Console |
| nginx socket() [::]:80 failed | IPv6 disabled di kernel — hapus `listen [::]:80` dari nginx config |

### Update Manual (tanpa CI/CD)

Dari lokal:
```powershell
cd C:\Users\MANAKreatif\CascadeProjects\lms-bimbel
git add -A; git commit -m "fix: deskripsi"; git push origin feat/worldwide-upgrade
# Jika perlu push ke remote worldwidebimbel juga:
git push worldwidebimbel feat/worldwide-upgrade
```

Di server:
```bash
cd /var/www/lms-bimbel
git pull origin feat/worldwide-upgrade
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build
pm2 restart lms-bimbel --update-env
```

Atau satu baris:
```bash
cd /var/www/lms-bimbel && git pull origin feat/worldwide-upgrade && npm install && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run build && pm2 restart lms-bimbel --update-env
```
Bila lama tidak diupdate (package-lock.json di server berubah — error "local changes would be overwritten"):
```bash
cd /var/www/lms-bimbel && git checkout -- package-lock.json && git pull origin feat/worldwide-upgrade && npm install && npx prisma generate && npx prisma migrate deploy && npm run db:seed && npm run build && pm2 restart lms-bimbel --update-env
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

- Login OAuth: `https://worldwidebimbel.com/api/auth/callback/google`
- Gmail OAuth2: `https://worldwidebimbel.com/api/admin/email/callback`
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

> **Application error: a client-side exception has occurred while loading worldwidebimbel.com (see the browser console for more information).**

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
cat .env | grep DATABASE_URL
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
cp .env /tmp/.env.backup
rm -rf node_modules .next
npm install
cp /tmp/.env.backup .env
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart lms-bimbel --update-env
sleep 10 && pm2 logs lms-bimbel --lines 20
```

#### Langkah 5: Cek database jika masih error

```bash
psql -U lmsuser -d worldwidebimbel -h localhost -c "SELECT 1;"
systemctl restart postgresql
sleep 5
pm2 logs lms-bimbel --lines 30 | grep -i "database\|prisma\|connection"
```

### Verifikasi Setelah Recovery

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://worldwidebimbel.com
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
- **Backup .env:**
  ```bash
  cp /var/www/lms-bimbel/.env /root/.env.backup
  ```
- **Pastikan `DIRECT_URL` tetap terisi** setelah update repo — `schema.prisma` mendeklarasikan `directUrl = env("DIRECT_URL")`. Jika env var hilang/empty, `prisma migrate deploy` akan gagal dengan error `Environment variable not found: DIRECT_URL`. Untuk PostgreSQL lokal (tanpa pooler), isi `DIRECT_URL` dengan nilai yang sama dengan `DATABASE_URL`.

---

## Checklist Deploy Server Baru

- [ ] SSH bisa akses ke `root@[IP-VPS-IDCLOUDHOST]`
- [ ] Node.js 20, PM2, Git, Nginx terinstall
- [ ] Nginx berjalan (jika error IPv6, hapus `listen [::]:80`)
- [ ] PostgreSQL berjalan, database & user dibuat
- [ ] Repo berhasil di-clone ke `/var/www/lms-bimbel`
- [ ] `.env` terisi dengan benar (URL = `https://worldwidebimbel.com`, `DATABASE_URL` & `DIRECT_URL` terisi)
- [ ] `npm install` berhasil
- [ ] `npx prisma generate` berhasil
- [ ] `npx prisma migrate deploy` berhasil
- [ ] `npm run db:seed` berhasil
- [ ] `npm run build` berhasil
- [ ] PM2 menjalankan app di port 3000
- [ ] Nginx reverse proxy aktif
- [ ] DNS `worldwidebimbel.com` → `[IP-VPS-IDCLOUDHOST]` sudah propagasi
- [ ] SSL Let's Encrypt aktif (`https://worldwidebimbel.com`)
- [ ] Google OAuth redirect URI sudah didaftarkan untuk domain baru
- [ ] Verifikasi: `curl -I https://worldwidebimbel.com` mengembalikan 200
- [ ] Login admin bisa diakses di `https://worldwidebimbel.com/admin`

