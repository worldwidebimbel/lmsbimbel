import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { updateStudentStatus } from "@/lib/student-status";
import { advanceCommissionStatus } from "@/lib/commission";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { payments: { where: { confirmedAt: null }, take: 1 } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "PENDING") return NextResponse.json({ error: "Tagihan tidak dalam status menunggu konfirmasi" }, { status: 400 });

  const pendingPayment = invoice.payments[0];
  if (!pendingPayment) return NextResponse.json({ error: "Tidak ada pembayaran pending" }, { status: 400 });

  await db.$transaction([
    db.payment.update({
      where: { id: pendingPayment.id },
      data: { confirmedAt: new Date(), confirmedBy: session.user.id },
    }),
    db.invoice.update({
      where: { id },
      data: { status: "PAID" },
    }),
  ]);

  await logAudit({
    entity: "Invoice",
    entityId: id,
    action: "APPROVE_PAYMENT",
    before: { status: invoice.status },
    after: { status: "PAID", paymentId: pendingPayment.id },
  });

  await updateStudentStatus(invoice.studentId);

  // Trigger affiliate commission advancement on payment approval
  const registration = await db.registration.findFirst({
    where: { convertedUserId: invoice.studentId },
    select: { id: true },
  });
  if (registration) {
    await advanceCommissionStatus({
      registrationId: registration.id,
      trigger: "PAYMENT_VERIFIED",
    });
  }

  await db.notification.create({
    data: {
      userId: invoice.studentId,
      type: "SUCCESS",
      title: "Pembayaran Dikonfirmasi",
      content: "Pembayaran QRIS Anda telah dikonfirmasi oleh admin. Terima kasih!",
      link: "/siswa/tagihan",
    },
  });

  return NextResponse.json({ success: true });
}
