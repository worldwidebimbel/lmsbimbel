import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { order_id, transaction_status, gross_amount, payment_type } = body;

  const successStatuses = ["settlement", "capture"];
  if (!successStatuses.includes(transaction_status)) {
    return NextResponse.json({ ok: true, handled: false });
  }

  if (!order_id) return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });

  if (order_id.startsWith("EVT-")) {
    const registrationId = order_id.split("-")[1];
    if (!registrationId) return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });

    const registration = await db.eventRegistration.findUnique({ where: { id: registrationId } });
    if (!registration) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

    await db.eventRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        externalId: order_id,
      },
    });

    await logAudit({ entity: "EventRegistration", entityId: registrationId, action: "UPDATE", after: { paymentStatus: "PAID", externalId: order_id, via: "midtrans-callback" } });

    return NextResponse.json({ ok: true, handled: true });
  }

  const invoiceId = order_id.split("-")[1];
  if (!invoiceId) return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const amount = Number(gross_amount) || invoice.amount;

  await db.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({ where: { invoiceId, method: "MIDTRANS" } });
    if (!existing) {
      await tx.payment.create({
        data: {
          invoiceId,
          userId: invoice.studentId,
          amount,
          method: "MIDTRANS",
          externalId: payment_type ?? null,
          confirmedAt: new Date(),
        },
      });
    }
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
  });

  await logAudit({ entity: "Invoice", entityId: invoiceId, action: "UPDATE", before: { status: invoice.status }, after: { status: "PAID", amount, via: "midtrans-callback" } });

  return NextResponse.json({ ok: true, handled: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
