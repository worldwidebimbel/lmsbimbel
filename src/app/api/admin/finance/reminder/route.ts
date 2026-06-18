import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoices = await db.invoice.findMany({
    where: { status: { in: ["UNPAID", "OVERDUE"] } },
    include: { student: { select: { name: true, email: true } } },
  });

  if (invoices.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const inv of invoices) {
    if (!inv.student.email) continue;
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
            <p>Jatuh tempo: <strong>${new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong></p>
            <p>Silakan segera melakukan pembayaran melalui aplikasi EduBimbel.</p>
            <a href="${process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id"}/siswa/tagihan"
               style="display:inline-block;margin-top:16px;padding:10px 24px;background:#ea580c;color:white;border-radius:8px;text-decoration:none;font-weight:600">
              Lihat Tagihan
            </a>
          </div>
        `,
      });
      sent++;
    } catch {
      // skip failed email, continue others
    }
  }

  return NextResponse.json({ sent, total: invoices.length });
}
