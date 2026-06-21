import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
    include: { event: true, user: { select: { name: true, email: true } } },
  });
  if (!registration) return NextResponse.json({ error: "Belum terdaftar" }, { status: 404 });
  if (!registration.event.isPaid || registration.price === 0) {
    return NextResponse.json({ error: "Event ini gratis" }, { status: 400 });
  }
  if (registration.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Pembayaran sudah lunas" }, { status: 400 });
  }

  const body = await req.json();
  const provider = body.provider === "XENDIT" ? "XENDIT" : "MIDTRANS";
  const orderId = `EVT-${registration.id}-${Date.now()}`;
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id";

  if (provider === "MIDTRANS") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    if (!serverKey) return NextResponse.json({ error: "Gateway Midtrans belum dikonfigurasi" }, { status: 503 });

    const snap = await import("midtrans-client").then((m) => m.default);
    const s = new snap.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    });

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: registration.price },
      customer_details: { first_name: registration.user.name, email: registration.user.email },
      callbacks: { finish: `${baseUrl}/events/${id}`, error: `${baseUrl}/events/${id}` },
    };

    const token = await s.createTransactionToken(parameter);
    await db.eventRegistration.update({
      where: { id: registration.id },
      data: { paymentMethod: "MIDTRANS", paymentToken: token, externalId: orderId },
    });

    return NextResponse.json({
      provider,
      token,
      orderId,
      redirectUrl: (isProduction ? "https://app.midtrans.com/snap/v2/vtweb/" : "https://app.sandbox.midtrans.com/snap/v2/vtweb/") + token,
    });
  }

  // XENDIT
  const apiKey = process.env.XENDIT_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Gateway Xendit belum dikonfigurasi" }, { status: 503 });

  const res = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
    },
    body: JSON.stringify({
      external_id: orderId,
      amount: registration.price,
      payer_email: registration.user.email,
      description: `Pembayaran ${registration.event.title}`,
      success_redirect_url: `${baseUrl}/events/${id}`,
      failure_redirect_url: `${baseUrl}/events/${id}`,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Gagal membuat invoice Xendit" }, { status: 502 });
  const data = await res.json();
  await db.eventRegistration.update({
    where: { id: registration.id },
    data: { paymentMethod: "XENDIT", externalId: orderId },
  });

  return NextResponse.json({ provider, orderId, redirectUrl: data.invoice_url });
}
