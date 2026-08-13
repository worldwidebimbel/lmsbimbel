import { type NextRequest, NextResponse } from "next/server";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";
import { db } from "@/lib/db";
import { clearOAuth2Cache } from "@/lib/email";

function strip(v?: string) {
  return (v ?? "").replace(/^["']|["']$/g, "").trim();
}

async function getOAuth2Creds(): Promise<{ clientId: string; clientSecret: string } | null> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: ["gmail_client_id", "gmail_client_secret"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  const clientId = map.gmail_client_id || strip(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = map.gmail_client_secret || strip(process.env.GOOGLE_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

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

  const creds = await getOAuth2Creds();
  if (!creds) {
    return new NextResponse(htmlPage("⚠️ Kredensial Tidak Lengkap", `
      <p>Client ID atau Client Secret belum diset. Masukkan kredensial di Settings → Email → Gmail OAuth2 terlebih dahulu.</p>
      <a href="/admin/settings?tab=email" class="btn">← Kembali ke Settings</a>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const callbackUri = `${strip(process.env.NEXTAUTH_URL).replace(/\/$/, "") || "http://localhost:3000"}/api/admin/email/callback`;
  const mailer = new GmailOAuth2(creds.clientId, creds.clientSecret, callbackUri);

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

    let connectedEmail = "";
    try {
      connectedEmail = await mailer.getConnectedEmail(tokens.access_token) ?? "";
    } catch { /* ignore */ }

    await db.appSetting.upsert({
      where: { key: "gmail_refresh_token" },
      create: { key: "gmail_refresh_token", value: refreshToken },
      update: { value: refreshToken },
    });
    if (connectedEmail) {
      await db.appSetting.upsert({
        where: { key: "gmail_connected_email" },
        create: { key: "gmail_connected_email", value: connectedEmail },
        update: { value: connectedEmail },
      });
      await db.appSetting.upsert({
        where: { key: "gmail_from" },
        create: { key: "gmail_from", value: connectedEmail },
        update: { value: connectedEmail },
      });
    }
    clearOAuth2Cache();

    return new NextResponse(htmlPage("✅ Berhasil! Gmail Terhubung", `
      <p>Otorisasi Gmail berhasil! Refresh token dan email terhubung telah disimpan otomatis ke database.</p>
      ${connectedEmail ? `<p>Email terhubung: <strong>${connectedEmail}</strong></p>` : ""}
      <div class="actions">
        <a href="/admin/settings?tab=email" class="btn btn-primary">← Kembali ke Settings</a>
      </div>
      <p style="margin-top:16px;font-size:0.8rem;color:#6b7280">Tidak perlu menyalin token manual atau mengedit .env.local. Konfigurasi sudah aktif.</p>
    `), { headers: { "Content-Type": "text/html; charset=utf-8" } });

  } catch (err: unknown) {
    const msg   = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : undefined;
    const causeMsg = cause instanceof Error ? cause.message : (cause ? String(cause) : "");
    return new NextResponse(htmlPage("❌ Gagal Tukar Token", `
      <p>Error saat menukar code dengan token:</p>
      <code class="error">${msg}</code>
      ${causeMsg ? `<code class="error" style="margin-top:8px">Cause: ${causeMsg}</code>` : ""}
      <br>
      <p style="font-size:0.8rem;color:#6b7280;margin-top:12px">
        Redirect URI yang dipakai: <code>${callbackUri}</code><br>
        Pastikan URI ini sudah terdaftar persis di Google Cloud Console &rarr; OAuth 2.0 Client &rarr; Authorized redirect URIs.
      </p>
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
