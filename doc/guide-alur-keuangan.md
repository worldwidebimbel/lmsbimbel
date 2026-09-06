# Guide: Alur Keuangan

## 1. Arsitektur Gateway

| Gateway | Role | Webhook Endpoint | Signature Verification |
|---------|------|------------------|----------------------|
| Duitku | Primary | `/api/payments/webhook/duitku` | `verifyCallback()` — SHA256 dengan merchantCode + amount + merchantOrderId + serverKey |
| Midtrans | Fallback | `/api/payments/midtrans/callback` | SHA512: `order_id + status_code + gross_amount + server_key` |
| Xendit | Fallback | `/api/payments/webhook/xendit` | `x-callback-token` header atau `callback_token` body vs `XENDIT_WEBHOOK_TOKEN` |

**Urutan fallback**: Duitku → Midtrans → Xendit (di `event-payment.ts` dan `siswa/pay-online`).

## 2. Format Order ID

```
INV-{invoiceId}-{timestamp}    → pembayaran tagihan SPP
EVT-{registrationId}-{timestamp} → pembayaran event
PPDB-{registrationId}-{timestamp} → pembayaran PPDB
```

Parsing: `parts.slice(1, -1).join("-")` karena CUID mengandung hyphens.

## 3. Alur Pembayaran Invoice (SPP)

### 3a. Admin Buat Invoice
- Route: `/admin/finance/new` → POST ke API finance
- Admin pilih siswa, paket, nominal, jatuh tempo
- Status awal: `UNPAID`

### 3b. Siswa/Orang Tua Bayar
**QRIS (manual)**:
1. Siswa/ortu upload bukti transfer → `POST /api/siswa/tagihan/[id]/bayar` atau `/api/orangtua/tagihan/[id]/bayar`
2. Invoice status → `PENDING`
3. Payment record dibuat (method: QRIS, confirmedAt: null)
4. Notifikasi ke admin cabang

**Online (Duitku/Midtrans/Xendit)**:
1. Siswa/ortu klik "Bayar Online" → `POST /api/siswa/tagihan/[id]/pay-online` atau `/api/orangtua/tagihan/[id]/pay-online`
2. Guard: tolak jika status `PAID` atau `PENDING` (cegah duplikat)
3. Invoice status → `PENDING`, Payment record dibuat
4. Redirect ke gateway payment page
5. Setelah bayar, gateway kirim webhook → invoice `PAID`, Payment `confirmedAt` di-set, BranchTransaction dibuat, notifikasi ke siswa

### 3c. Admin Konfirmasi
- **Approve** (`POST /api/admin/finance/invoices/[id]/approve`): konfirmasi Payment pending → `PAID` + BranchTransaction
- **Confirm** (`POST /api/admin/finance/invoices/[id]/confirm`): konfirmasi langsung tanpa proof → `PAID` + BranchTransaction
- **Reject** (`POST /api/admin/finance/invoices/[id]/reject`): hapus Payment pending → balik ke `UNPAID` + notifikasi siswa

## 4. Alur Pembayaran Event

1. Siswa register event berbayar → `POST /api/events/[id]/register`
2. Klik "Bayar" → `POST /api/events/[id]/pay` → `createEventPayment()`
3. Guard: tolak jika `paymentStatus` sudah `PAID` atau `PENDING`
4. Duitku/Midtrans/Xendit fallback
5. Webhook → `paymentStatus: PAID`, notifikasi ke user

## 5. Alur Pembayaran PPDB

1. Calon siswa daftar → `POST /api/ppdb` (public)
2. Admin/verifikator kirim link bayar → `POST /api/payments/ppdb/[id]/checkout`
3. Guard: tolak jika `paymentStatus` sudah `PAID` atau `PENDING`
4. Webhook → `paymentStatus: PAID`, status → `WAITING_VERIFICATION`, BranchTransaction dibuat

## 6. BranchTransaction (Keuangan Cabang)

Setiap pembayaran yang berhasil **wajib** membuat `BranchTransaction`:

| Source | Category | Type |
|--------|----------|------|
| Duitku webhook (invoice) | Pembayaran SPP | INCOME |
| Midtrans callback (invoice) | Pembayaran SPP | INCOME |
| Xendit webhook (invoice) | Pembayaran SPP | INCOME |
| Admin approve (QRIS proof) | Pembayaran SPP | INCOME |
| Admin confirm (langsung) | Pembayaran SPP | INCOME |
| Duitku webhook (PPDB) | Pendaftaran PPDB | INCOME |
| Midtrans callback (PPDB) | Pendaftaran PPDB | INCOME |
| Xendit webhook (PPDB) | Pendaftaran PPDB | INCOME |

Event payment tidak membuat BranchTransaction karena EventRegistration tidak punya `branchId`.

## 7. Idempotency

Semua webhook handler cek status sebelum update:
- Invoice: `if (invoice.status === "PAID") return`
- Event: `if (registration.paymentStatus === "PAID") return`
- PPDB: `if (registration.paymentStatus === "PAID") return`
- Duitku: juga cek `payment.confirmedAt`

## 8. Security

- **Webhook signature**: semua 3 gateway verifikasi signature/token
- **Role guard**: siswa hanya bisa bayar invoice sendiri, ortu hanya invoice anak terlink
- **Branch isolation**: admin cabang hanya bisa konfirmasi invoice cabangnya
- **Audit log**: semua mutasi pembayaran tercatat di AuditLog
- **PENDING guard**: cegah double-checkout (klik berulang = 1 sesi pembayaran)

## 9. Laporan Keuangan

- **Halaman**: `/admin/finance/laporan` — summary cards, rekap periodik, per metode, per program, per cabang, laba/rugi, piutang, komisi
- **Export Excel**: `/api/admin/finance/export` — 5 sheet: Tagihan, Pembayaran, Transaksi Cabang, Komisi, Ringkasan
- **Filter**: branch (super admin bisa semua), period (daily/weekly/monthly/yearly)
- **Payment filter**: via relasi `invoice.branchId` (Payment tidak punya `branchId` langsung)

## 10. Cron & Reminder

- `/api/cron/scheduler` — setiap hari:
  - Invoice `UNPAID` dengan dueDate lewat → `OVERDUE`
  - Notifikasi reminder H-3, H-1, H-0
- `/api/admin/finance/reminder` — admin kirim reminder manual via email/WhatsApp

## 11. Env Variables yang Dibutuhkan

```
# Duitku (primary)
DUITKU_MERCHANT_CODE=
DUITKU_API_KEY=
DUITKU_CALLBACK_URL=

# Midtrans (fallback)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Xendit (fallback)
XENDIT_API_KEY=
XENDIT_WEBHOOK_TOKEN=

# App
NEXTAUTH_URL=https://your-domain.com
```

## 12. Smoke Test Manual

1. **Buat invoice** sebagai admin → cek status `UNPAID`
2. **Login sebagai siswa** → buka `/siswa/tagihan` → cek invoice muncul
3. **Klik "Bayar QRIS"** → upload bukti → cek status `PENDING` → cek notifikasi admin
4. **Login admin** → buka `/admin/finance` → approve → cek status `PAID` + BranchTransaction
5. **Klik "Bayar Online"** (jika Duitku configured) → redirect ke gateway → bayar → webhook → cek `PAID`
6. **Cek laporan** `/admin/finance/laporan` → pastikan angka konsisten
7. **Export Excel** → buka 5 sheet
8. **Test reject** → buat invoice baru → upload proof → admin reject → cek balik `UNPAID`
9. **Login ortu** → buka `/orangtua/tagihan` → cek bisa bayar online dan QRIS
10. **Test event payment** → register event berbayar → bayar → webhook → `PAID`
11. **Test PPDB payment** → checkout → webhook → `PAID` + `WAITING_VERIFICATION`
