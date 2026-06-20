import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getBranchScope } from "@/lib/branch-context";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json().catch(() => ({}));
  const { invoiceIds, channels } = body as { invoiceIds?: string[]; channels?: ("email" | "whatsapp")[] };
  const sendChannels = channels?.length ? channels : ["email"];

  const whereClause: any = { status: { in: ["UNPAID", "OVERDUE"] } };
  if (!isSuperAdmin && branchId) whereClause.branchId = branchId;
  if (Array.isArray(invoiceIds) && invoiceIds.length) whereClause.id = { in: invoiceIds };

  const invoices = await db.invoice.findMany({
    where: whereClause,
    include: { student: { select: { name: true, email: true, profile: { select: { phone: true } } } }, plan: { select: { name: true } } },
  });

  if (invoices.length === 0) return NextResponse.json({ sent: 0, total: 0 });

  let sent = 0;
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id";

  for (const inv of invoices) {
    const statusText = inv.status === "OVERDUE" ? "JATUH TEMPO" : "SEGERA JATUH TEMPO";
    const dueText = new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const message = `Halo ${inv.student.name}, tagihan Anda sebesar Rp ${inv.amount.toLocaleString("id-ID")} ${inv.status === "OVERDUE" ? "telah melewati" : "akan jatuh tempo pada"} ${dueText}. Silakan segera bayar melalui ${baseUrl}/siswa/tagihan. Terima kasih.`;

    if (sendChannels.includes("email") && inv.student.email) {
      try {
        await sendEmail({
          to: inv.student.email,
          subject: `Reminder Tagihan — ${inv.status === "OVERDUE" ? "Jatuh Tempo!" : "Segera Bayar"}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
              <h2 style="color:#ea580c">Reminder Tagihan</h2>
              <p>Halo <strong>${inv.student.name}</strong>,</p>
              <p>Tagihan Anda sebesar <strong>Rp ${inv.amount.toLocaleString("id-ID")}</strong>
                 ${inv.status === "OVERDUE" ? "telah <span style='color:red'>melewati jatuh tempo</span>." : "akan segera jatuh tempo."}
              </p>
              <p>Jatuh tempo: <strong>${dueText}</strong></p>
              <p>Silakan segera melakukan pembayaran melalui aplikasi EduBimbel.</p>
              <a href="${baseUrl}/siswa/tagihan"
                 style="display:inline-block;margin-top:16px;padding:10px 24px;background:#ea580c;color:white;border-radius:8px;text-decoration:none;font-weight:600">
                Lihat Tagihan
              </a>
            </div>
          `,
        });
        sent++;
      } catch {
        // continue
      }
    }

    if (sendChannels.includes("whatsapp") && inv.student.profile?.phone) {
      try {
        await sendWhatsApp({
          to: inv.student.profile.phone,
          message,
        });
        sent++;
      } catch {
        // continue
      }
    }
  }

  return NextResponse.json({ sent, total: invoices.length, channels: sendChannels });
}
