import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createInvoice, getCallbackUrl, getCallbackBaseUrl, isDuitkuConfigured } from "@/lib/payment-gateway";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: registrationId } = await params;

  const registration = await db.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  }

  if (!registration.registrationFee || registration.registrationFee === 0) {
    return NextResponse.json({ error: "Tidak ada biaya pendaftaran" }, { status: 400 });
  }

  if (registration.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Pembayaran sudah lunas" }, { status: 400 });
  }

  const configured = await isDuitkuConfigured();
  if (!configured) {
    return NextResponse.json({ error: "Payment gateway belum dikonfigurasi" }, { status: 503 });
  }

  const baseUrl = getCallbackBaseUrl();
  const merchantOrderId = `PPDB-${registration.id}-${Date.now()}`;
  const productDetails = `Biaya Pendaftaran PPDB — ${registration.fullName}`;
  const email = registration.email || registration.parentEmail || "";
  const phone = registration.whatsapp || registration.parentPhone || "";

  try {
    const result = await createInvoice({
      paymentAmount: Math.round(registration.registrationFee),
      merchantOrderId,
      productDetails,
      customerVaName: registration.fullName,
      email: email || "no-reply@bimbel.id",
      phoneNumber: phone || undefined,
      itemDetails: [
        {
          name: productDetails,
          price: Math.round(registration.registrationFee),
          quantity: 1,
        },
      ],
      customerDetail: {
        firstName: registration.fullName,
        email: email || "no-reply@bimbel.id",
        phoneNumber: phone || undefined,
      },
      returnUrl: `${baseUrl}/daftar/status?no=${registration.registrationNo}&payment=done`,
      callbackUrl: getCallbackUrl(),
      expiryPeriod: 1440,
    });

    await db.registration.update({
      where: { id: registration.id },
      data: {
        paymentStatus: "PENDING",
        paymentMethod: "DUITKU",
        externalId: merchantOrderId,
      },
    });

    await logAudit({ entity: "Registration", entityId: registration.id, action: "UPDATE", after: { paymentStatus: "PENDING", paymentMethod: "DUITKU", externalId: merchantOrderId, amount: registration.registrationFee } });

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      reference: result.reference,
      merchantOrderId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ppdb-checkout] Duitku createInvoice error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
