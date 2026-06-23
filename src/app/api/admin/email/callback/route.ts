import { type NextRequest, NextResponse } from "next/server";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(htmlPage("❌ Otorisasi Ditolak", `
      <p>Google menolak permintaan otorisasi: <code>${error}</code></p>
      <p>Pastikan kamu sudah menambahkan akun Google kamu sebagai <strong>Test User</strong> di Google Cloud Console
         (OAuth consent screen → Test users).</p>
      <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (!code) {
    return new NextResponse(htmlPage("⚠️ Kode Tidak Ditemukan", `
      <p>Parameter <code>code</code> tidak ditemukan di URL callback.</p>
      <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse(htmlPage("⚠️ Kredensial Tidak Lengkap", `
      <p>GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET belum diset di .env.local</p>
      <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const callbackUri = `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/["\']/g, "").replace(/\/$/, "")}/api/admin/email/callback`;
  const mailer = new GmailOAuth2(clientId, clientSecret, callbackUri);

  try {
    const tokens = await mailer.exchangeCode(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return new NextResponse(htmlPage("⚠️ Refresh Token Tidak Ada", `
        <p>Google tidak mengembalikan <code>refresh_token</code>. Ini biasanya terjadi jika akun sudah pernah diotorisasi sebelumnya.</p>
        <p>Cara mendapatkan ulang:</p>
        <ol>
          <li>Buka <a href="https://myaccount.google.com/permissions" target="_blank">https://myaccount.google.com/permissions</a></li>
          <li>Cari nama app kamu dan cabut aksesnya (<em>Revoke</em>)</li>
          <li>Ulangi proses otorisasi dari Settings → Email → Gmail OAuth2</li>
        </ol>
        <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
      `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return new NextResponse(htmlPage("✅ Berhasil! Salin Refresh Token", `
      <p>Otorisasi Gmail berhasil. Salin nilai <code>GOOGLE_REFRESH_TOKEN</code> di bawah dan tambahkan ke file <code>.env.local</code> di server.</p>
      <div class="token-box" id="tokenBox">${refreshToken}</div>
      <div class="actions">
        <button onclick="copyToken()" class="btn btn-primary">📋 Salin Token</button>
        <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
      </div>
      <div class="env-block">
        <p>Tambahkan baris ini ke <code>.env.local</code>:</p>
        <pre>GOOGLE_REFRESH_TOKEN=${refreshToken}
GMAIL_FROM=akungmail@gmail.com</pre>
        <p>Setelah itu <strong>restart server</strong> agar perubahan env aktif.</p>
      </div>
      <script>
        function copyToken() {
          navigator.clipboard.writeText(document.getElementById('tokenBox').textContent ?? '');
          event.target.textContent = '✅ Tersalin!';
          setTimeout(() => event.target.textContent = '📋 Salin Token', 2000);
        }
      </script>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(htmlPage("❌ Gagal Tukar Token", `
      <p>Error saat menukar code dengan token:</p>
      <code class="error">${msg}</code>
      <br><br>
      <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

function htmlPage(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Gmail OAuth2 Setup</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 60px auto; padding: 0 24px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p, li { line-height: 1.6; color: #374151; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.875rem; }
    pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-size: 0.8rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    .token-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 0.8rem; word-break: break-all; margin: 16px 0; color: #15803d; }
    .env-block { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 20px; }
    .env-block p { margin: 0 0 8px; font-size: 0.875rem; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; border: 1px solid #d1d5db; background: #fff; color: #374151; cursor: pointer; }
    .btn:hover { background: #f9fafb; }
    .btn-primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
    .btn-primary:hover { background: #4338ca; }
    .error { display: block; background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; color: #b91c1c; font-size: 0.875rem; word-break: break-all; }
    ol { padding-left: 20px; }
    a { color: #4f46e5; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
</body>
</html>`;
}
