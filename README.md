# EduBimbel LMS

Sistem Manajemen Pembelajaran (LMS) untuk Lembaga Bimbingan Belajar dengan **Admin Feature Control Panel**.

**Live:** https://lmsbimbel.digsan.id  
**Repo:** https://github.com/digsanid-26/lmsbimbel

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI:** shadcn/ui + Lucide Icons
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5
- **Deploy:** VPS IDCloudHost + PM2 + Nginx

---

## Setup Development

### 1. Clone & Install
```bash
git clone https://github.com/digsanid-26/lmsbimbel
cd lmsbimbel
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local sesuai konfigurasi
```

### 3. Database
```bash
npm run db:push      # Push schema ke database
npm run db:seed      # Isi data awal (feature flags, users demo)
npm run db:studio    # Buka Prisma Studio
```

### 4. Jalankan
```bash
npm run dev          # Development (http://localhost:3000)
```

---

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@lmsbimbel.id | admin123 |
| Guru | guru@lmsbimbel.id | guru123 |
| Siswa | siswa@lmsbimbel.id | siswa123 |
| Orang Tua | orangtua@lmsbimbel.id | ortu123 |

---

## Setup VPS (Production)

### Install dependencies di VPS
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Nginx
sudo apt install nginx
```

### Clone & Setup
```bash
cd /var/www
git clone https://github.com/digsanid-26/lmsbimbel lms-bimbel
cd lms-bimbel
npm install
cp .env.example .env.local
# Edit .env.local dengan DATABASE_URL production
npm run db:push
npm run db:seed
npm run build
pm2 start npm --name lms-bimbel -- start
pm2 save
pm2 startup
```

### Nginx Config
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d lmsbimbel.digsan.id
```

### GitHub Secrets (untuk CI/CD)

Di repo GitHub → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `DATABASE_URL` | URL PostgreSQL production |
| `NEXTAUTH_SECRET` | Random string 32 char |
| `NEXTAUTH_URL` | https://lmsbimbel.digsan.id |
| `NEXT_PUBLIC_APP_URL` | https://lmsbimbel.digsan.id |
| `VPS_USER` | Username SSH VPS |
| `VPS_SSH_KEY` | Private key SSH |

---

## Fitur Utama

- ✅ **Feature Control Panel** — Admin toggle 23 fitur on/off real-time
- ✅ **Multi-role** — Super Admin, Admin, Guru, Siswa, Orang Tua
- ✅ **Sidebar Dinamis** — Menu menyesuaikan fitur aktif
- ✅ **Manajemen Kelas & Jadwal**
- ✅ **Materi, Tugas, Ujian Online**
- ✅ **Absensi & Nilai**
- ✅ **Portal Orang Tua**
- ✅ **Keuangan & Pembayaran**
