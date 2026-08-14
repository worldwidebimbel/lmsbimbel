import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCallback, isCallbackSuccess, type CallbackData } from "@/lib/payment-gateway";

export async function POST(req: NextRequest) {
  let body: Record<string, string>;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await req.json().catch(() => ({}));
  } else {
    const formData = await req.formData().catch(() => null);
    if (formData) {
      body = {};
      formData.forEach((value, key) => {
        body[key] = String(value);
      });
    } else {
      const text = await req.text().catch(() => "");
      body = {};
      new URLSearchParams(text).forEach((value, key) => {
        body[key] = value;
      });
    }
  }

  const callbackData: CallbackData = {
    merchantCode: body.merchantCode || "",
    amount: Number(body.amount) || 0,
    merchantOrderId: body.merchantOrderId || "",
    productDetail: body.productDetail || "",
    additionalParam: body.additionalParam || "",
    paymentCode: body.paymentCode || "",
    resultCode: body.resultCode || "",
    merchantUserId: body.merchantUserId || "",
    reference: body.reference || "",
    signature: body.signature || "",
    publisherOrderId: body.publisherOrderId || "",
    settlementDate: body.settlementDate || "",
    issuerCode: body.issuerCode || "",
    bankAppCode: body.bankAppCode || "",
    bankOrderId: body.bankOrderId || "",
    bankRespCode: body.bankRespCode || "",
    bankRespMsg: body.bankRespMsg || "",
    cardName: body.cardName || "",
    cardType: body.cardType || "",
    maskedNumber: body.maskedNumber || "",
    tokenId: body.tokenId || "",
    transactionState: body.transactionState || "",
    transactionStateStatus: body.transactionStateStatus || "",
    merchantCustomerId: body.merchantCustomerId || "",
    expiryDate: body.expiryDate || "",
    customerName: body.customerName || "",
  };

  const valid = await verifyCallback(callbackData);
  if (!valid) {
    console.warn("[duitku-webhook] Bad signature or missing params:", callbackData.merchantOrderId);
    return NextResponse.json({ error: "Bad Signature" }, { status: 400 });
  }

  const success = isCallbackSuccess(callbackData.resultCode);
  const merchantOrderId = callbackData.merchantOrderId;

  // Parse order type: INV-{invoiceId}-{timestamp}, EVT-{registrationId}-{timestamp}, PPDB-{registrationId}-{timestamp}
  const prefix = merchantOrderId.split("-")[0];

  try {
    if (prefix === "INV") {
      await handleInvoicePayment(merchantOrderId, callbackData, success);
    } else if (prefix === "EVT") {
      await handleEventPayment(merchantOrderId, callbackData, success);
    } else if (prefix === "PPDB") {
      await handlePpdbPayment(merchantOrderId, callbackData, success);
    } else {
      console.warn("[duitku-webhook] Unknown order prefix:", prefix, merchantOrderId);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[duitku-webhook] Error processing callback:", msg);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

// ─── Invoice payment handler ─────────────────────────────

async function handleInvoicePayment(
  merchantOrderId: string,
  callback: CallbackData,
  success: boolean,
) {
  // Extract invoiceId: INV-{invoiceId}-{timestamp}
  const parts = merchantOrderId.split("-");
  const invoiceId = parts.slice(1, -1).join("-");

  const payment = await db.payment.findFirst({
    where: { externalId: merchantOrderId, method: "DUITKU" },
    include: { invoice: { include: { branch: true } } },
  });

  if (!payment || !payment.invoice) {
    console.warn("[duitku-webhook] Payment not found for:", merchantOrderId);
    return;
  }

  // Idempotent: skip if already confirmed
  if (payment.confirmedAt) {
    return;
  }

  const invoice = payment.invoice;
  const amount = callback.amount || invoice.amount;

  if (success) {
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          confirmedAt: new Date(),
          externalId: callback.reference || merchantOrderId,
        },
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: "PAID" },
      });

      if (invoice.branchId) {
        await tx.branchTransaction.create({
          data: {
            branchId: invoice.branchId,
            type: "INCOME",
            category: "Pembayaran SPP",
            amount,
            note: `Pembayaran Duitku — ${invoice.id.slice(-6)} (${callback.reference ?? ""})`,
            createdBy: invoice.studentId,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: invoice.studentId,
          type: "PAYMENT",
          title: "Pembayaran Diterima",
          content: `Pembayaran tagihan ${invoice.id.slice(-6)} sebesar Rp ${amount.toLocaleString("id-ID")} telah diterima via Duitku.`,
        },
      });
    });
  } else {
    // Payment failed — revert invoice to UNPAID
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "UNPAID" },
    });
  }
}

// ─── Event payment handler ───────────────────────────────

async function handleEventPayment(
  merchantOrderId: string,
  callback: CallbackData,
  success: boolean,
) {
  // EVT-{registrationId}-{timestamp}
  const parts = merchantOrderId.split("-");
  const registrationId = parts.slice(1, -1).join("-");

  const registration = await db.eventRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    console.warn("[duitku-webhook] Event registration not found:", registrationId);
    return;
  }

  if (registration.paymentStatus === "PAID") return; // idempotent

  if (success) {
    await db.eventRegistration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        externalId: callback.reference || merchantOrderId,
        paymentMethod: "DUITKU",
      },
    });

    await db.notification.create({
      data: {
        userId: registration.userId,
        type: "PAYMENT",
        title: "Pembayaran Event Berhasil",
        content: `Pembayaran event telah diterima via Duitku. Status registrasi: CONFIRMED.`,
      },
    });
  }
}

// ─── PPDB payment handler ────────────────────────────────

async function handlePpdbPayment(
  merchantOrderId: string,
  callback: CallbackData,
  success: boolean,
) {
  // PPDB-{registrationId}-{timestamp}
  const parts = merchantOrderId.split("-");
  const registrationId = parts.slice(1, -1).join("-");

  const registration = await db.registration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    console.warn("[duitku-webhook] PPDB registration not found:", registrationId);
    return;
  }

  if (registration.paymentStatus === "PAID") return; // idempotent

  if (success) {
    await db.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "DUITKU",
        externalId: callback.reference || merchantOrderId,
        paidAt: new Date(),
        ...(registration.status === "DRAFT" || registration.status === "SUBMITTED"
          ? { status: "WAITING_VERIFICATION" as const }
          : {}),
      },
    });

    if (registration.convertedUserId) {
      await db.notification.create({
        data: {
          userId: registration.convertedUserId,
          type: "PAYMENT",
          title: "Pembayaran PPDB Diterima",
          content: `Pembayaran PPDB untuk ${registration.fullName} telah diterima via Duitku.`,
        },
      });
    }
  } else {
    await db.registration.update({
      where: { id: registrationId },
      data: { paymentStatus: "FAILED" },
    });
  }
}
