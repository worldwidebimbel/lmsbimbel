import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { sendWhatsApp } from "@/lib/ppdb-notifications";

export async function notifyAfiliatorReferral(opts: {
  affiliateId: string;
  registrationNo: string;
  studentName: string;
  programName?: string;
}) {
  const affiliate = await db.affiliate.findUnique({
    where: { id: opts.affiliateId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!affiliate?.user) return;

  await db.notification.create({
    data: {
      userId: affiliate.user.id,
      type: "SUCCESS",
      title: "Referral Baru!",
      content: `Pendaftar ${opts.studentName} (${opts.registrationNo}) telah mendaftar dengan kode referral Anda${opts.programName ? ` untuk program ${opts.programName}` : ""}.`,
      link: "/afiliator",
    },
  });

  try {
    await sendEmail({
      to: affiliate.user.email,
      subject: `Referral Baru: ${opts.studentName}`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#16a34a">Referral Baru!</h2>
        <p>Halo <b>${affiliate.user.name}</b>,</p>
        <p>Pendaftar <b>${opts.studentName}</b> (${opts.registrationNo}) telah mendaftar dengan kode referral Anda${opts.programName ? ` untuk program <b>${opts.programName}</b>` : ""}.</p>
        <p>Status komisi: <b>Pending</b> — akan aktif setelah pendaftar terverifikasi dan pembayaran dikonfirmasi.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Afiliator Program</p>
      </div>`,
    });
  } catch (err) {
    console.error("[Afiliator Notif] Failed to send referral email:", err);
  }
}

export async function notifyAfiliatorCommission(opts: {
  affiliateId: string;
  amount: number;
  studentName: string;
  status: string;
}) {
  const affiliate = await db.affiliate.findUnique({
    where: { id: opts.affiliateId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!affiliate?.user) return;

  const statusLabel: Record<string, string> = {
    PENDING: "Pending",
    REGISTRATION_VERIFIED: "Registrasi Terverifikasi",
    PAYMENT_VERIFIED: "Pembayaran Terverifikasi",
    VALID: "Komisi Aktif",
    READY_PAYOUT: "Siap Dicairkan",
    PAID: "Sudah Dibayar",
    CANCELLED: "Dibatalkan",
  };

  await db.notification.create({
    data: {
      userId: affiliate.user.id,
      type: opts.status === "CANCELLED" ? "WARNING" : "SUCCESS",
      title: `Update Komisi: ${statusLabel[opts.status] || opts.status}`,
      content: `Komisi Rp ${opts.amount.toLocaleString("id-ID")} dari referral ${opts.studentName} kini berstatus: ${statusLabel[opts.status] || opts.status}.`,
      link: "/afiliator",
    },
  });

  if (affiliate.user.email) {
    try {
      await sendEmail({
        to: affiliate.user.email,
        subject: `Update Komisi: ${statusLabel[opts.status] || opts.status}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#3B82F6">Update Komisi</h2>
          <p>Halo <b>${affiliate.user.name}</b>,</p>
          <p>Komisi <b>Rp ${opts.amount.toLocaleString("id-ID")}</b> dari referral <b>${opts.studentName}</b> kini berstatus: <b>${statusLabel[opts.status] || opts.status}</b>.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Afiliator Program</p>
        </div>`,
      });
    } catch (err) {
      console.error("[Afiliator Notif] Failed to send commission email:", err);
    }
  }
}

export async function notifyAfiliatorPayout(opts: {
  affiliateId: string;
  amount: number;
  status: string;
}) {
  const affiliate = await db.affiliate.findUnique({
    where: { id: opts.affiliateId },
    include: { user: { select: { id: true, email: true, name: true, profile: { select: { phone: true } } } } },
  });
  if (!affiliate?.user) return;

  const statusLabel: Record<string, string> = {
    REQUESTED: "Pencairan Diajukan",
    APPROVED: "Pencairan Disetujui",
    REJECTED: "Pencairan Ditolak",
    PAID: "Pencairan Berhasil",
  };

  await db.notification.create({
    data: {
      userId: affiliate.user.id,
      type: opts.status === "REJECTED" ? "WARNING" : "SUCCESS",
      title: `Update Pencairan: ${statusLabel[opts.status] || opts.status}`,
      content: `Pencairan Rp ${opts.amount.toLocaleString("id-ID")} kini berstatus: ${statusLabel[opts.status] || opts.status}.`,
      link: "/afiliator",
    },
  });

  if (affiliate.user.email) {
    try {
      await sendEmail({
        to: affiliate.user.email,
        subject: `Update Pencairan: ${statusLabel[opts.status] || opts.status}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#F59E0B">Update Pencairan Komisi</h2>
          <p>Halo <b>${affiliate.user.name}</b>,</p>
          <p>Pencairan <b>Rp ${opts.amount.toLocaleString("id-ID")}</b> kini berstatus: <b>${statusLabel[opts.status] || opts.status}</b>.</p>
          <p style="color:#6b7280;font-size:12px;margin-top:16px">EduBimbel Afiliator Program</p>
        </div>`,
      });
    } catch (err) {
      console.error("[Afiliator Notif] Failed to send payout email:", err);
    }
  }

  const phone = affiliate.user.profile?.phone;
  if (phone) {
    await sendWhatsApp(phone, `*EduBimbel - Update Pencairan*\n\nHalo ${affiliate.user.name},\nPencairan Rp ${opts.amount.toLocaleString("id-ID")} kini: *${statusLabel[opts.status] || opts.status}*`);
  }
}
