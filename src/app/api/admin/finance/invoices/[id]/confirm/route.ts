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
  const body = await req.json();
  const { amount, method, proofUrl } = body;

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [payment] = await db.$transaction([
    db.payment.create({
      data: {
        invoiceId: id,
        userId: session.user.id,
        amount: Number(amount ?? invoice.amount),
        method: method ?? "CASH",
        proofUrl: proofUrl ?? null,
        confirmedAt: new Date(),
        confirmedBy: session.user.id,
      },
    }),
    db.invoice.update({
      where: { id },
      data: { status: "PAID" },
    }),
  ]);

  await logAudit({
    entity: "Payment",
    entityId: payment.id,
    action: "CONFIRM",
    after: { invoiceId: id, amount: Number(amount ?? invoice.amount), method: method ?? "CASH" },
  });

  await logAudit({
    entity: "Invoice",
    entityId: id,
    action: "STATUS_CHANGE",
    before: { status: invoice.status },
    after: { status: "PAID" },
  });

  await updateStudentStatus(invoice.studentId);

  // Trigger affiliate commission advancement on payment verification
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

  return NextResponse.json(payment, { status: 201 });
}
