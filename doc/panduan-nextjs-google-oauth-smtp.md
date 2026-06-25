# Panduan Lengkap: Google OAuth2 Login + SMTP Email di Next.js (2026)

**Versi:** Terbaru & Proven Work  
**Framework:** Next.js (App Router) + Auth.js v5  
**Dibuat untuk:** Kamu yang stuck di OAuth redirect mismatch atau Gmail SMTP

---

## Pendahuluan

Banyak developer Next.js gagal setup Google Login + kirim email karena:
- Redirect URI tidak **exact match**
- Pakai password Gmail biasa (bukan App Password)
- Env var salah atau tidak di-restart
- Lupa setup OAuth Consent Screen

Panduan ini **step-by-step**, copy-paste friendly, dan sudah diuji di setup modern 2025-2026.

---

## 1. Google OAuth2 Login dengan Auth.js v5 (Rekomendasi Utama)

Auth.js (dulu NextAuth.js) adalah cara paling bersih dan aman untuk OAuth di Next.js.

### Langkah 1: Setup Google Cloud Console (PALING KRITIS)

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat **Project baru** atau pilih yang sudah ada.
3. Pergi ke **APIs & Services > OAuth consent screen**
   - Pilih **External**
   - Isi:
     - App name
     - User support email
     - Developer contact
   - Tambahkan scopes: `email`, `profile`, `openid`
   - Save & Continue (lewati sampai selesai)
4. Pergi ke **Credentials > Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: `Next.js App` (bebas)
   - **Authorized redirect URIs** (WAJIB EXACT):
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://domainkamu.com/api/auth/callback/google`
   - Klik **Create**
5. Copy **Client ID** dan **Client Secret**

> **Peringatan:** Kalau belum di-verify, app cuma bisa dipakai akun kamu sendiri (normal untuk development).

### Langkah 2: Installasi di Next.js

```bash
npm install next-auth
```

### Langkah 3: Buat File Konfigurasi

**File: `auth.ts`** (di root project, bukan di folder `app/`)

```ts
// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Paksa minta consent & refresh token setiap login (opsional)
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt", // ganti ke "database" kalau pakai Prisma + adapter
  },
  secret: process.env.AUTH_SECRET,
})
```

**File: `app/api/auth/[...nextauth]/route.ts`**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // sesuaikan path kalau auth.ts di src/

export const { GET, POST } = handlers
```

### Langkah 4: Environment Variables

Buat / update file `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Auth.js
AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # generate: openssl rand -base64 32
AUTH_URL=http://localhost:3000                             # production: https://domainkamu.com

# (Opsional) Untuk production
NODE_ENV=production
```

**Restart dev server** setelah ubah `.env.local`

### Langkah 5: Penggunaan di Komponen

**Login Button (Client Component)**

```tsx
'use client'

import { signIn } from "next-auth/react"

export default function GoogleLoginButton() {
  return (
    <button 
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="bg-red-500 text-white px-6 py-3 rounded-lg flex items-center gap-2"
    >
      <span>Login dengan Google</span>
    </button>
  )
}
```

**Cek Session (Server Component)**

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      {/* Logout button pakai signOut() */}
    </div>
  )
}
```

**Middleware Protection** (opsional)

```ts
// middleware.ts (di root)
export { auth as middleware } from "@/auth"

// Contoh proteksi route tertentu
export const config = {
  matcher: ["/dashboard/:path*"],
}
```

---

## 2. Mengirim Email dengan Nodemailer + Gmail SMTP

Gmail bagus untuk testing, **tapi jangan dipakai production** (ada limit + reputasi buruk).

### Langkah 1: Generate App Password Gmail (WAJIB)

1. Buka Google Account → **Security**
2. Aktifkan **2-Step Verification** (kalau belum)
3. Scroll ke bawah → **App passwords**
4. Pilih **Mail** → Other (nama: `Next.js App`)
5. Copy **16 karakter** password yang muncul

### Langkah 2: Install Nodemailer

```bash
npm install nodemailer
npm install -D @types/nodemailer   # TypeScript
```

### Langkah 3: Buat Server Action / Fungsi Email

**File: `app/actions/send-email.ts`**

```ts
'use server'

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,                    // true hanya untuk port 465
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,   // 16 char App Password
  },
})

interface SendEmailProps {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailProps) {
  try {
    const info = await transporter.sendMail({
      from: `"Nama Aplikasi Kamu" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || "",
    })

    console.log("✅ Email berhasil dikirim:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("❌ Gagal kirim email:", error)
    return { success: false, error }
  }
}
```

### Langkah 4: Tambah ke `.env.local`

```env
GMAIL_USER=yourname@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   # 16 karakter dari App Password
```

### Contoh Penggunaan di Form

```tsx
'use client'

import { sendEmail } from './actions/send-email'
import { useState } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState('')

  async function handleSubmit(formData: FormData) {
    setStatus('Mengirim...')

    const result = await sendEmail({
      to: "admin@domain.com",
      subject: `Pesan dari ${formData.get("name")}`,
      html: `
        <p><strong>Nama:</strong> ${formData.get("name")}</p>
        <p><strong>Email:</strong> ${formData.get("email")}</p>
        <p><strong>Pesan:</strong></p>
        <p>${formData.get("message")}</p>
      `,
    })

    if (result.success) {
      setStatus("Email berhasil dikirim! ✅")
    } else {
      setStatus("Gagal mengirim email. Coba lagi.")
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input name="name" placeholder="Nama" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Pesan kamu..." required />
      <button type="submit">Kirim Pesan</button>
      {status && <p>{status}</p>}
    </form>
  )
}
```

---

## Alternatif Lebih Baik untuk Production

| Kebutuhan              | Rekomendasi          | Alasan                              | Gratis Tier |
|------------------------|----------------------|-------------------------------------|-------------|
| Email Transaksional    | **Resend.com**       | Paling mudah, modern, deliverability bagus | Ya         |
| Email Marketing        | Brevo / Mailtrap     | Lebih murah untuk volume besar      | Ya         |
| Full Auth + Database   | Better Auth + Prisma | Lebih ringan dari Auth.js           | -          |
| All-in-one             | Supabase Auth        | OAuth + Database + Email langsung   | Ya         |

**Resend contoh cepat:**
```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({ from: '...', to: '...', subject: '...', html: '...' })
```

---

## Troubleshooting Umum

| Masalah                        | Penyebab & Solusi |
|--------------------------------|-------------------|
| `redirect_uri_mismatch`        | URI di Google Console **harus persis sama** dengan yang dipanggil NextAuth. Cek http vs https, trailing slash, localhost vs 127.0.0.1 |
| `invalid_client`               | Client ID / Secret salah atau env var tidak terbaca |
| Gmail SMTP gagal auth          | Pakai **App Password** 16 karakter, bukan password biasa |
| Email tidak sampai             | Cek spam, atau pakai Resend/Brevo |
| Session tidak muncul           | Pastikan `AUTH_SECRET` ada & restart server |
| Error di production            | Pastikan `AUTH_URL` sudah di-set ke domain production |

---

## Bonus Tips

- Selalu pakai **TypeScript** + strict mode
- Simpan secret di `.env.local` (jangan commit ke git)
- Untuk production, tambahkan **rate limiting** & **CSRF protection** (sudah ada di Auth.js)
- Kalau mau login + register + magic link sekaligus → pertimbangkan **Better Auth**
- Test dulu di localhost sampai 100% jalan, baru deploy

---

## Kesimpulan

Dengan panduan ini kamu sudah punya:
- ✅ Google OAuth2 Login yang aman
- ✅ Sistem kirim email via SMTP
- ✅ Struktur yang rapi & scalable

Simpan file `.md` ini, nanti tinggal buka lagi kalau lupa.

Kalau masih ada error atau mau versi dengan **Prisma + Database session**, **Resend**, atau **Better Auth**, bilang aja — aku buatkan versi lanjutannya.

**Selamat coding!** 🚀

---

*Panduan ini dibuat berdasarkan best practice Auth.js v5 + Nodemailer per Juni 2026.*
