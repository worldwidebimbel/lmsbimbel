import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = body.reason ?? "Bukti pembayaran tidak valid";

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { payments: { where: { confirmedAt: null }, take: 1 } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "PENDING") return NextResponse.json({ error: "Tagihan tidak dalam status pending" }, { status: 400 });

  const pendingPayment = invoice.payments[0];

  await db.$transaction([
    ...(pendingPayment ? [db.payment.delete({ where: { id: pendingPayment.id } })] : []),
    db.invoice.update({
      where: { id },
      data: { status: "UNPAID" },
    }),
  ]);

  await logAudit({
    entity: "Invoice",
    entityId: id,
    action: "REJECT_PAYMENT",
    before: { status: invoice.status },
    after: { status: "UNPAID", reason },
  });

  await db.notification.create({
    data: {
      userId: invoice.studentId,
      type: "WARNING",
      title: "Bukti Pembayaran Ditolak",
      content: `Bukti pembayaran Anda ditolak: ${reason}. Silakan upload ulang.`,
      link: "/siswa/tagihan",
    },
  });

  return NextResponse.json({ success: true });
}
