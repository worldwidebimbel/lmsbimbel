import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvoice, getCallbackUrl, isDuitkuConfigured, getCallbackBaseUrl } from "@/lib/payment-gateway";
import { logAudit } from "@/lib/audit";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true, profile: { select: { phone: true } } } },
      plan: { select: { name: true } },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await db.parentChild.findFirst({
    where: { parentId: session.user.id, childId: invoice.studentId },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "PAID") return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 });
  if (invoice.status === "PENDING") return NextResponse.json({ error: "Tagihan sedang menunggu pembayaran/konfirmasi" }, { status: 400 });

  const duitkuReady = await isDuitkuConfigured();
  if (!duitkuReady) {
    return NextResponse.json({ error: "Gateway pembayaran belum dikonfigurasi" }, { status: 503 });
  }

  const baseUrl = getCallbackBaseUrl();
  const merchantOrderId = `INV-${invoice.id}-${Date.now()}`;
  const productDetails = invoice.plan
    ? `Pembayaran ${invoice.plan.name}`
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
      itemDetails: [{ name: productDetails, price: Math.round(invoice.amount), quantity: 1 }],
      customerDetail: { firstName: invoice.student.name, email: invoice.student.email, phoneNumber: phone },
      returnUrl: `${baseUrl}/orangtua/tagihan?payment=done&id=${invoice.id}`,
      callbackUrl: getCallbackUrl(),
      expiryPeriod: 1440,
    });

    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "PENDING", enableOnlinePayment: true, onlinePaymentMethod: "DUITKU" },
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

    await logAudit({ entity: "Invoice", entityId: invoice.id, action: "UPDATE", after: { status: "PENDING", enableOnlinePayment: true, onlinePaymentMethod: "DUITKU", externalId: merchantOrderId, amount: invoice.amount, byRole: "ORANG_TUA" } });

    return NextResponse.json({ provider: "DUITKU", redirectUrl: result.paymentUrl, reference: result.reference });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ortu pay-online] Duitku error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
