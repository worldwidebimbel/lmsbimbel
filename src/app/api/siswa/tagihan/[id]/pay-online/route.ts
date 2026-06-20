import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await db.invoice.findUnique({
    where: { id, studentId: session.user.id },
    include: { student: { select: { name: true, email: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!invoice.enableOnlinePayment) return NextResponse.json({ error: "Pembayaran online tidak aktif untuk tagihan ini" }, { status: 400 });
  if (invoice.status === "PAID") return NextResponse.json({ error: "Tagihan sudah lunas" }, { status: 400 });

  const provider = invoice.onlinePaymentMethod ?? "MIDTRANS";

  if (provider === "MIDTRANS") {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    if (!serverKey) {
      return NextResponse.json({ error: "Gateway Midtrans belum dikonfigurasi" }, { status: 503 });
    }

    const snap = await import("midtrans-client").then((m) => m.default);
    const s = new snap.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id";
    const parameter = {
      transaction_details: {
        order_id: `INV-${invoice.id}-${Date.now()}`,
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
    return NextResponse.json({ provider, token, redirectUrl: isProduction ? "https://app.midtrans.com/snap/v2/vtweb/" + token : "https://app.sandbox.midtrans.com/snap/v2/vtweb/" + token });
  }

  if (provider === "XENDIT") {
    const apiKey = process.env.XENDIT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gateway Xendit belum dikonfigurasi" }, { status: 503 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://lmsbimbel.digsan.id";
    const res = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64"),
      },
      body: JSON.stringify({
        external_id: `INV-${invoice.id}-${Date.now()}`,
        amount: invoice.amount,
        payer_email: invoice.student.email,
        description: `Pembayaran ${invoice.student.name}`,
        success_redirect_url: `${baseUrl}/siswa/tagihan`,
        failure_redirect_url: `${baseUrl}/siswa/tagihan`,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal membuat invoice Xendit" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ provider, redirectUrl: data.invoice_url });
  }

  return NextResponse.json({ error: "Provider tidak dikenal" }, { status: 400 });
}
