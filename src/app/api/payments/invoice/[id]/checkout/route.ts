import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvoice, getCallbackUrl, getReturnUrl, isDuitkuConfigured } from "@/lib/payment-gateway";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: invoiceId } = await params;

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: { select: { id: true, name: true, email: true, profile: { select: { phone: true } } } },
      branch: { select: { id: true, name: true } },
      plan: { select: { name: true } },
      program: { select: { name: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
  }

  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    return NextResponse.json({ error: `Invoice sudah ${invoice.status}` }, { status: 400 });
  }

  if (invoice.studentId !== session.user.id && !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configured = await isDuitkuConfigured();
  if (!configured) {
    return NextResponse.json({ error: "Payment gateway belum dikonfigurasi" }, { status: 503 });
  }

  const merchantOrderId = `INV-${invoice.id}-${Date.now()}`;
  const productDetails = invoice.plan
    ? `Pembayaran ${invoice.plan.name}`
    : invoice.program
      ? `Pembayaran ${invoice.program.name}`
      : `Pembayaran Tagihan ${invoice.id.slice(-6)}`;

  const phone = invoice.student.profile?.phone || undefined;

  try {
    const result = await createInvoice({
      paymentAmount: Math.round(invoice.amount),
      merchantOrderId,
      productDetails,
      customerVaName: invoice.student.name,
      email: invoice.student.email,
      phoneNumber: phone,
      itemDetails: [
        {
          name: productDetails,
          price: Math.round(invoice.amount),
          quantity: 1,
        },
      ],
      customerDetail: {
        firstName: invoice.student.name,
        email: invoice.student.email,
        phoneNumber: phone,
      },
      returnUrl: getReturnUrl("invoice", invoice.id),
      callbackUrl: getCallbackUrl(),
      expiryPeriod: 1440,
    });

    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PENDING",
        enableOnlinePayment: true,
        onlinePaymentMethod: "DUITKU",
      },
    });

    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        userId: session.user.id,
        amount: invoice.amount,
        method: "DUITKU",
        externalId: merchantOrderId,
      },
    });

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      merchantOrderId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] Duitku createInvoice error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
