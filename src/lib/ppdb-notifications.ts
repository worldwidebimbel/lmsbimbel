import { sendEmail } from "@/lib/email";

interface WhatsAppConfig {
  token: string;
  url: string;
}

function getWhatsAppConfig(): WhatsAppConfig | null {
  const token = process.env.WA_TOKEN;
  const url = process.env.WA_URL || "https://api.wapanels.com/send-message";
  if (!token) return null;
  return { token, url };
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const cfg = getWhatsAppConfig();
  if (!cfg) {
    console.warn("[WA] WhatsApp not configured, skipping message to", phone);
    return false;
  }
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });
    return res.ok;
  } catch (err) {
    console.error("[WA] Failed to send WhatsApp:", err);
    return false;
  }
}

export async function notifyCredentials(opts: {
  email: string;
  whatsapp?: string | null;
  name: string;
  loginEmail: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const subject = "Akun LMS EduBimbel Anda Siap!";
  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#16a34a">Selamat Datang di EduBimbel!</h2>
      <p>Yth. <b>${opts.name}</b>,</p>
      <p>Akun LMS Anda telah dibuat. Berikut kredensial login Anda:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#6b7280">Email Login</td><td><b>${opts.loginEmail}</b></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Password Sementara</td><td><b>${opts.tempPassword}</b></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">URL Login</td><td><a href="${opts.loginUrl}">${opts.loginUrl}</a></td></tr>
      </table>
      <p style="margin-top:16px;background:#fef3c7;padding:12px;border-radius:8px;font-size:14px">
        ⚠️ Mohon segera ganti password Anda setelah login pertama.
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Learning Management System</p>
    </div>
  `;

  try {
    await sendEmail({ to: opts.email, subject, html });
  } catch (err) {
    console.error("[Notify] Failed to send credential email:", err);
  }

  if (opts.whatsapp) {
    const waMsg = `*EduBimbel - Akun LMS Anda Siap!*\n\nHalo ${opts.name},\n\nAkun LMS Anda telah dibuat:\n📧 Email: ${opts.loginEmail}\n🔑 Password: ${opts.tempPassword}\n🔗 Login: ${opts.loginUrl}\n\nMohon segera ganti password setelah login.`;
    await sendWhatsApp(opts.whatsapp, waMsg);
  }
}

const PPDB_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Pendaftaran Diterima",
  DOCUMENT_REVIEW: "Dokumen Sedang Direview",
  INTERVIEW_SCHEDULED: "Jadwal Wawancara Telah Ditetapkan",
  ACCEPTED: "Diterima",
  CLASS_PLACEMENT: "Penempatan Kelas",
  ACTIVE_STUDENT: "Selamat! Anda Kini Siswa Aktif",
  REJECTED: "Pendaftaran Ditolak",
};

export async function notifyPPDBStatus(opts: {
  email?: string | null;
  whatsapp?: string | null;
  name: string;
  registrationNo: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string | null;
}) {
  const label = PPDB_STATUS_LABELS[opts.toStatus] || opts.toStatus;
  const subject = `Update PPDB: ${label} — ${opts.registrationNo}`;

  const html = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2 style="color:#3B82F6">Update Status Pendaftaran</h2>
      <p>Yth. <b>${opts.name}</b>,</p>
      <p>Status pendaftaran Anda telah diperbarui:</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px 0;color:#6b7280">No. Pendaftaran</td><td><b>${opts.registrationNo}</b></td></tr>
        <tr><td style="padding:8px 0;color:#6b7280">Status Baru</td><td><b style="color:#16a34a">${label}</b></td></tr>
        ${opts.note ? `<tr><td style="padding:8px 0;color:#6b7280">Catatan</td><td>${opts.note}</td></tr>` : ""}
      </table>
      <p style="margin-top:16px">Anda dapat cek status pendaftaran kapan saja di:</p>
      <p><a href="${process.env.NEXTAUTH_URL || ""}/daftar/status">Cek Status Pendaftaran</a></p>
      <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Learning Management System</p>
    </div>
  `;

  if (opts.email) {
    try {
      await sendEmail({ to: opts.email, subject, html });
    } catch (err) {
      console.error("[Notify] Failed to send PPDB status email:", err);
    }
  }

  if (opts.whatsapp) {
    const waMsg = `*EduBimbel - Update PPDB*\n\nHalo ${opts.name},\nStatus pendaftaran Anda (${opts.registrationNo}) kini: *${label}*\n${opts.note ? `Catatan: ${opts.note}\n` : ""}Cek status: ${process.env.NEXTAUTH_URL || ""}/daftar/status`;
    await sendWhatsApp(opts.whatsapp, waMsg);
  }
}
