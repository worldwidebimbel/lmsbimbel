import nodemailer from "nodemailer";
import https from "node:https";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";
import { db } from "@/lib/db";

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export type EmailMethod = "resend" | "oauth2" | "smtp" | "none";

function env(key: string): string {
  return (process.env[key] ?? "").replace(/^["']|["']$/g, "").trim();
}

// Cache for DB-stored OAuth2 settings (refreshed every 60s)
let dbOAuth2Cache: { data: Record<string, string>; ts: number } | null = null;
const DB_CACHE_TTL = 60_000;

async function getDbOAuth2Settings(): Promise<Record<string, string>> {
  if (dbOAuth2Cache && Date.now() - dbOAuth2Cache.ts < DB_CACHE_TTL) {
    return dbOAuth2Cache.data;
  }
  try {
    const rows = await db.appSetting.findMany({
      where: {
        key: {
          in: [
            "gmail_client_id",
            "gmail_client_secret",
            "gmail_refresh_token",
            "gmail_from",
            "gmail_connected_email",
          ],
        },
      },
    });
    const data: Record<string, string> = {};
    for (const r of rows) data[r.key] = r.value;
    dbOAuth2Cache = { data, ts: Date.now() };
    return data;
  } catch {
    return {};
  }
}

export function clearOAuth2Cache() {
  dbOAuth2Cache = null;
}

export type GmailCredSource = "database" | "env" | "mixed";

export async function getGmailOAuthCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  source: GmailCredSource;
} | null> {
  let map: Record<string, string> = {};
  try {
    const rows = await db.appSetting.findMany({
      where: { key: { in: ["gmail_client_id", "gmail_client_secret"] } },
    });
    map = {};
    for (const r of rows) map[r.key] = r.value;
  } catch {
    map = {};
  }
  const dbId = (map.gmail_client_id ?? "").trim();
  const dbSecret = (map.gmail_client_secret ?? "").trim();
  const envId = env("GOOGLE_CLIENT_ID");
  const envSecret = env("GOOGLE_CLIENT_SECRET");
  if (dbId && dbSecret) return { clientId: dbId, clientSecret: dbSecret, source: "database" };
  if (envId && envSecret) return { clientId: envId, clientSecret: envSecret, source: "env" };
  const clientId = dbId || envId;
  const clientSecret = dbSecret || envSecret;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, source: "mixed" };
}

export async function getActiveEmailMethodAsync(): Promise<EmailMethod> {
  if (env("RESEND_API_KEY")) return "resend";
  const dbCfg = await getDbOAuth2Settings();
  const hasOAuth2Db = !!(dbCfg.gmail_client_id && dbCfg.gmail_client_secret && dbCfg.gmail_refresh_token && dbCfg.gmail_from);
  const hasOAuth2Env = !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET") && env("GOOGLE_REFRESH_TOKEN") && env("GMAIL_FROM"));
  if (hasOAuth2Db || hasOAuth2Env) return "oauth2";
  if (env("SMTP_USER") && env("SMTP_PASS")) return "smtp";
  return "none";
}

export function getActiveEmailMethod(): EmailMethod {
  if (env("RESEND_API_KEY")) return "resend";
  if (
    env("GOOGLE_CLIENT_ID") &&
    env("GOOGLE_CLIENT_SECRET") &&
    env("GOOGLE_REFRESH_TOKEN") &&
    env("GMAIL_FROM")
  ) return "oauth2";
  if (env("SMTP_USER") && env("SMTP_PASS")) return "smtp";
  return "none";
}

export async function getEmailConfigAsync() {
  const dbCfg = await getDbOAuth2Settings();
  const clientId = dbCfg.gmail_client_id || env("GOOGLE_CLIENT_ID");
  const clientSecret = dbCfg.gmail_client_secret || env("GOOGLE_CLIENT_SECRET");
  const refreshToken = dbCfg.gmail_refresh_token || env("GOOGLE_REFRESH_TOKEN");
  const gmailFrom = dbCfg.gmail_from || env("GMAIL_FROM");
  const connectedEmail = dbCfg.gmail_connected_email || "";

  return {
    method: await getActiveEmailMethodAsync(),
    resend: {
      apiKey: env("RESEND_API_KEY"),
      from: env("RESEND_FROM") || "EduBimbel <no-reply@resend.dev>",
    },
    oauth2: {
      clientId,
      clientSecret,
      refreshToken,
      gmailFrom,
      connectedEmail,
      callbackUri: `${env("NEXTAUTH_URL").replace(/\/$/, "") || "http://localhost:3000"}/api/admin/email/callback`,
    },
    smtp: {
      host: env("SMTP_HOST") || "smtp.gmail.com",
      port: Number(env("SMTP_PORT") || 587),
      secure: env("SMTP_SECURE") === "true",
      user: env("SMTP_USER"),
      pass: env("SMTP_PASS"),
    },
  };
}

function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function resendHttpSend(opts: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ from: opts.from, to: opts.to, subject: opts.subject, html: opts.html });
    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed: Record<string, unknown> = {};
          try { parsed = JSON.parse(raw); } catch { /* ignore */ }
          if ((res.statusCode ?? 500) >= 400) {
            const msg = (parsed.message as string) ?? (parsed.name as string) ?? raw;
            reject(new Error(`Resend API ${res.statusCode}: ${msg}`));
          } else {
            resolve(parsed as { id: string });
          }
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Resend API timeout: server tidak dapat menjangkau api.resend.com. Cek firewall/network VPS.")); });
    req.write(body);
    req.end();
  });
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  const method = await getActiveEmailMethodAsync();
  const toAddr = Array.isArray(to) ? to.join(", ") : to;
  const appName = process.env.APP_NAME ?? "EduBimbel";

  if (method === "resend") {
    const cfg = await getEmailConfigAsync();
    try {
      const result = await resendHttpSend({
        apiKey: cfg.resend.apiKey,
        from: cfg.resend.from,
        to: Array.isArray(to) ? to : [toAddr],
        subject,
        html,
      });
      return { id: result.id, provider: "resend" };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[email] Resend send failed:", msg, err);
      throw err;
    }
  }

  if (method === "oauth2") {
    const cfg = await getEmailConfigAsync();
    const mailer = new GmailOAuth2(
      cfg.oauth2.clientId,
      cfg.oauth2.clientSecret,
      cfg.oauth2.callbackUri,
    );
    try {
      return await mailer.refreshAndSend(cfg.oauth2.refreshToken, {
        from: `"${appName}" <${cfg.oauth2.gmailFrom}>`,
        to: toAddr,
        subject,
        html,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[email] OAuth2 send failed:", msg, err);
      throw err;
    }
  }

  if (method === "smtp") {
    const transporter = getSmtpTransporter();
    try {
      return await transporter.sendMail({
        from: `"${appName}" <${env("SMTP_USER")}>`,
        to: toAddr,
        subject,
        html,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[email] SMTP send failed:", msg, err);
      throw err;
    }
  }

  console.warn("[email] No email method configured, skipping:", subject);
  return { skipped: true };
}

export function emailInvoiceCreated(opts: {
  to: string;
  name: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Tagihan Baru: ${opts.invoiceNo}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#3B82F6">Tagihan Pembayaran</h2>
        <p>Yth. <b>${opts.name}</b>,</p>
        <p>Berikut informasi tagihan Anda:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 0;color:#6b7280">No. Invoice</td><td><b>${opts.invoiceNo}</b></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Jumlah</td><td><b>Rp ${opts.amount.toLocaleString("id-ID")}</b></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Jatuh Tempo</td><td><b>${opts.dueDate}</b></td></tr>
        </table>
        <p style="margin-top:16px">Mohon segera lakukan pembayaran sebelum jatuh tempo.</p>
        <p style="color:#6b7280;font-size:12px">EduBimbel Learning Management System</p>
      </div>
    `,
  });
}

export function emailAnnouncementBroadcast(opts: {
  to: string[];
  title: string;
  message: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Pengumuman: ${opts.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#3B82F6">Pengumuman</h2>
        <h3>${opts.title}</h3>
        <div style="background:#f9fafb;padding:16px;border-radius:8px;white-space:pre-wrap">${opts.message}</div>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Learning Management System</p>
      </div>
    `,
  });
}

export function emailAttendanceAlert(opts: {
  to: string;
  parentName: string;
  studentName: string;
  className: string;
  date: string;
  status: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: `Info Kehadiran: ${opts.studentName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#F59E0B">Info Kehadiran Siswa</h2>
        <p>Yth. <b>${opts.parentName}</b>,</p>
        <p>Berikut informasi kehadiran putra/putri Anda:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px 0;color:#6b7280">Nama Siswa</td><td><b>${opts.studentName}</b></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Kelas</td><td><b>${opts.className}</b></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Tanggal</td><td><b>${opts.date}</b></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280">Status</td>
            <td><b style="color:${opts.status === "HADIR" ? "#16a34a" : "#dc2626"}">${opts.status}</b></td></tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Learning Management System</p>
      </div>
    `,
  });
}
