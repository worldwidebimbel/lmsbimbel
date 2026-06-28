import { NextResponse } from "next/server";
import https from "node:https";
import { auth } from "@/lib/auth";
import { getEmailConfig } from "@/lib/email";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cfg = getEmailConfig();
  const checks: Record<string, { ok: boolean; detail: string }> = {
    method: { ok: cfg.method !== "none", detail: cfg.method },
    resend_api_key: { ok: !!cfg.resend.apiKey, detail: cfg.resend.apiKey ? "✓ diset" : "belum diset" },
    resend_from: { ok: !!cfg.resend.from, detail: cfg.resend.from || "belum diset" },
    client_id: { ok: !!cfg.oauth2.clientId, detail: cfg.oauth2.clientId ? "✓ diset" : "belum diset" },
    client_secret: { ok: !!cfg.oauth2.clientSecret, detail: cfg.oauth2.clientSecret ? "✓ diset" : "belum diset" },
    refresh_token: { ok: !!cfg.oauth2.refreshToken, detail: cfg.oauth2.refreshToken ? "✓ diset" : "belum diset" },
    gmail_from: { ok: !!cfg.oauth2.gmailFrom, detail: cfg.oauth2.gmailFrom || "belum diset" },
    smtp_user: { ok: !!cfg.smtp.user, detail: cfg.smtp.user ? "✓ diset" : "belum diset" },
    smtp_pass: { ok: !!cfg.smtp.pass, detail: cfg.smtp.pass ? "✓ diset" : "belum diset" },
    nextauth_url: { ok: !!process.env.NEXTAUTH_URL, detail: process.env.NEXTAUTH_URL || "belum diset" },
  };

  let refreshTest: { ok: boolean; detail: string } | null = null;
  let resendTest: { ok: boolean; detail: string } | null = null;

  if (cfg.method === "resend" && cfg.resend.apiKey) {
    resendTest = await new Promise<{ ok: boolean; detail: string }>((resolve) => {
      const req = https.request(
        {
          hostname: "api.resend.com",
          path: "/api-keys",
          method: "GET",
          headers: { Authorization: `Bearer ${cfg.resend.apiKey}` },
        },
        (res) => {
          let raw = "";
          res.on("data", (c) => (raw += c));
          res.on("end", () => {
            let parsed: Record<string, unknown> = {};
            try { parsed = JSON.parse(raw); } catch { /* ignore */ }
            const ok = (res.statusCode ?? 500) < 400;
            const keys = Array.isArray(parsed.data) ? parsed.data.length : "?";
            const errMsg = (parsed.message as string) ?? raw;
            resolve({
              ok,
              detail: ok ? `API key valid — ${keys} API key terdaftar` : `Resend API error ${res.statusCode}: ${errMsg}`,
            });
          });
        },
      );
      req.on("error", (err) => resolve({ ok: false, detail: err.message }));
      req.end();
    });
  }

  if (cfg.method === "oauth2" && cfg.oauth2.clientId && cfg.oauth2.clientSecret && cfg.oauth2.refreshToken) {
    const mailer = new GmailOAuth2(cfg.oauth2.clientId, cfg.oauth2.clientSecret, cfg.oauth2.callbackUri);
    try {
      const tokens = await mailer.refreshAccessToken(cfg.oauth2.refreshToken);
      refreshTest = {
        ok: !!tokens.access_token,
        detail: tokens.access_token
          ? `Access token berhasil didapat (expires_in=${tokens.expires_in ?? "?"}, scope=${tokens.scope ?? "?"})`
          : `Token refresh tidak mengembalikan access_token: ${JSON.stringify(tokens)}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      refreshTest = { ok: false, detail: msg };
    }
  }

  return NextResponse.json({
    method: cfg.method,
    callbackUri: cfg.oauth2.callbackUri,
    checks,
    refreshTest,
    resendTest,
    commonIssues: [
      "Resend: pastikan RESEND_API_KEY sudah benar dan domain sudah diverifikasi di dashboard Resend.",
      "Resend: untuk production, gunakan domain sendiri (bukan onboarding@resend.dev).",
      "Pastikan redirect URI di Google Cloud Console mencakup callbackUri di atas (persis, termasuk https/http).",
      "Gmail OAuth2 dan NextAuth Google login memakai client ID yang sama. Keduanya harus memiliki authorized redirect URIs masing-masing.",
      "OAuth consent screen minimal dalam mode Testing dan user pengirim sudah ditambahkan sebagai Test User.",
      "Gmail API harus enabled di project Google Cloud Console.",
      "Kalau refresh token pernah dicabut (revoked), klik Perbarui Token di Settings.",
      "Untuk SMTP Gmail: gunakan App Password, bukan password biasa, dan aktifkan 2FA.",
    ],
  });
}
