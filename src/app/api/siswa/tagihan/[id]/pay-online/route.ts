import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createInvoice, getCallbackUrl, isDuitkuConfigured, getCallbackBaseUrl } from "@/lib/payment-gateway";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id, studentId: session.user.id },
    include: { student: { select: { name: true, email: true, profile: { select: { phone: true } } } }, plan: { select: { name: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 });

  const baseUrl = getCallbackBaseUrl();
  const merchantOrderId = `INV-${invoice.id}-${Date.now()}`;
  const productDetails = invoice.plan
    ? `Pembayaran ${invoice.plan.name}`
    : `Pembayaran Tagihan ${invoice.id.slice(-6)}`;
  const phone = invoice.student.profile?.phone || undefined;

  // Try Duitku first
  const duitkuReady = await isDuitkuConfigured();
  if (duitkuReady) {
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
        returnUrl: `${baseUrl}/siswa/tagihan?payment=done&id=${invoice.id}`,
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

      return NextResponse.json({ provider: "DUITKU", redirectUrl: result.paymentUrl, reference: result.reference });
    } catch (err: unknown) {
      console.error("[pay-online] Duitku error:", err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback to Midtrans
  const provider = invoice.onlinePaymentMethod ?? "MIDTRANS";

  if (provider === "MIDTRANS") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    if (!serverKey) {
      return NextResponse.json({ error: "Gateway pembayaran belum dikonfigurasi" }, { status: 503 });
    }

    const snap = await import("midtrans-client").then((m) => m.default);
    const s = new snap.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    });

    const parameter = {
      transaction_details: {
        order_id: merchantOrderId,
        gross_amount: invoice.amount,
      },
      customer_details: {
        first_name: invoice.student.name,
        email: invoice.student.email,
      },
      callbacks: {
        finish: `${baseUrl}/siswa/tagihan`,
        error: `${baseUrl}/siswa/tagihan`,
      },
    };

    const token = await s.createTransactionToken(parameter);
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "PENDING", enableOnlinePayment: true, onlinePaymentMethod: "MIDTRANS" },
    });
    return NextResponse.json({ provider, token, redirectUrl: isProduction ? "https://app.midtrans.com/snap/v2/vtweb/" + token : "https://app.sandbox.midtrans.com/snap/v2/vtweb/" + token });
  }

  if (provider === "XENDIT") {
    const apiKey = process.env.XENDIT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gateway Xendit belum dikonfigurasi" }, { status: 503 });
    }

    const res = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
      },
      body: JSON.stringify({
        external_id: merchantOrderId,
        amount: invoice.amount,
        payer_email: invoice.student.email,
        description: productDetails,
        success_redirect_url: `${baseUrl}/siswa/tagihan`,
        failure_redirect_url: `${baseUrl}/siswa/tagihan`,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal membuat invoice Xendit" }, { status: 502 });
    }

    const data = await res.json();
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "PENDING", enableOnlinePayment: true, onlinePaymentMethod: "XENDIT" },
    });
    return NextResponse.json({ provider, redirectUrl: data.invoice_url });
  }

  return NextResponse.json({ error: "Provider tidak dikenal" }, { status: 400 });
}
