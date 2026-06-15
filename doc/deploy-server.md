# Panduan Deploy LMS Bimbel ke VPS IDCloudHost

**Domain:** lmsbimbel.digsan.id  
**IP VPS:** 103.172.204.160  
**Provider:** [console.idcloudhost.com](https://console.idcloudhost.com)  
**Repo:** https://github.com/digsanid-26/lmsbimbel

---

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

## 4. Clone Repository dari GitHub

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/digsanid-26/lmsbimbel lms-bimbel
cd lms-bimbel
```

> Karena repo **private**, otentikasi menggunakan Personal Access Token (PAT):
> - Buka GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
> - Scope: `repo`
> - Gunakan sebagai password saat `git clone`:
> ```bash
> git clone https://<USERNAME>:<TOKEN>@github.com/digsanid-26/lmsbimbel lms-bimbel
> ```

---

## 5. Konfigurasi Environment Variables

```bash
cp .env.example .env.local
nano .env.local
```

Isi `.env.local` dengan nilai production:

```env
DATABASE_URL="postgresql://lmsuser:GantiPasswordKuat123!@localhost:5432/lmsbimbel"

NEXTAUTH_URL="https://lmsbimbel.digsan.id"
NEXTAUTH_SECRET="isi-dengan-random-string-32-karakter"

GOOGLE_CLIENT_ID="isi-dari-google-console"
GOOGLE_CLIENT_SECRET="isi-dari-google-console"

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
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

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
cd /var/www/lms-bimbel
git pull origin main
npm install
npm run build
pm2 restart lms-bimbel
```
