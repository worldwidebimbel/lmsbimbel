import nodemailer from "nodemailer";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export type EmailMethod = "oauth2" | "smtp" | "none";

function env(key: string): string {
  return (process.env[key] ?? "").replace(/^["']|["']$/g, "").trim();
}

export function getActiveEmailMethod(): EmailMethod {
  if (
    env("GOOGLE_CLIENT_ID") &&
    env("GOOGLE_CLIENT_SECRET") &&
    env("GOOGLE_REFRESH_TOKEN") &&
    env("GMAIL_FROM")
  ) return "oauth2";
  if (env("SMTP_USER") && env("SMTP_PASS")) return "smtp";
  return "none";
}

export function getEmailConfig() {
  return {
    method: getActiveEmailMethod(),
    oauth2: {
      clientId: env("GOOGLE_CLIENT_ID"),
      clientSecret: env("GOOGLE_CLIENT_SECRET"),
      refreshToken: env("GOOGLE_REFRESH_TOKEN"),
      gmailFrom: env("GMAIL_FROM"),
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

export async function sendEmail({ to, subject, html }: MailOptions) {
  const method = getActiveEmailMethod();
  const toAddr = Array.isArray(to) ? to.join(", ") : to;
  const appName = process.env.APP_NAME ?? "EduBimbel";

  if (method === "oauth2") {
    const cfg = getEmailConfig();
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
