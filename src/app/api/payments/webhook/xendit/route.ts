import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function verifyXenditWebhookToken(req: NextRequest, body: Record<string, unknown>): boolean {
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!webhookToken) return false;

  const authHeader = req.headers.get("x-callback-token") || "";
  if (authHeader === webhookToken) return true;

  const bodyToken = String(body.callback_token ?? "");
  return bodyToken === webhookToken;
}

function parseOrderId(orderId: string): { prefix: string; id: string } | null {
  const parts = orderId.split("-");
  if (parts.length < 3) return null;
  const prefix = parts[0];
  const id = parts.slice(1, -1).join("-");
  if (!id) return null;
  return { prefix, id };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!verifyXenditWebhookToken(req, body)) {
    console.warn("[xendit-webhook] Bad callback token");
    return NextResponse.json({ error: "Bad Token" }, { status: 401 });
  }

  const status = String(body.status ?? "");
  const externalId = String(body.external_id ?? "");

  if (!externalId) return NextResponse.json({ error: "Missing external_id" }, { status: 400 });

  const successStatuses = ["PAID", "SETTLED"];
  if (!successStatuses.includes(status)) {
    return NextResponse.json({ ok: true, handled: false });
  }

  const parsed = parseOrderId(externalId);
  if (!parsed) return NextResponse.json({ error: "Invalid external_id" }, { status: 400 });

  const amount = Number(body.paid_amount ?? body.amount ?? 0);

  try {
    if (parsed.prefix === "INV") {
      await handleInvoicePayment(parsed.id, amount, externalId);
    } else if (parsed.prefix === "EVT") {
      await handleEventPayment(parsed.id, externalId);
    } else if (parsed.prefix === "PPDB") {
      await handlePpdbPayment(parsed.id, amount, externalId);
    } else {
      console.warn("[xendit-webhook] Unknown prefix:", parsed.prefix, externalId);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[xendit-webhook] Error:", msg);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

async function handleInvoicePayment(invoiceId: string, amount: number, externalId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { branch: true },
  });
  if (!invoice) {
    console.warn("[xendit-webhook] Invoice not found:", invoiceId);
    return;
  }
  if (invoice.status === "PAID") return;

  const finalAmount = amount || invoice.amount;

  await db.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({ where: { invoiceId, method: "XENDIT" } });
    if (!existing) {
      await tx.payment.create({
        data: {
          invoiceId,
          userId: invoice.studentId,
          amount: finalAmount,
          method: "XENDIT",
          externalId,
          confirmedAt: new Date(),
        },
      });
    } else if (!existing.confirmedAt) {
      await tx.payment.update({
        where: { id: existing.id },
        data: { confirmedAt: new Date(), externalId },
      });
    }

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });

    if (invoice.branchId) {
      await tx.branchTransaction.create({
        data: {
          branchId: invoice.branchId,
          type: "INCOME",
          category: "Pembayaran SPP",
          amount: finalAmount,
          note: `Pembayaran Xendit — ${invoice.id.slice(-6)} (${externalId})`,
          createdBy: invoice.studentId,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: invoice.studentId,
        type: "PAYMENT",
        title: "Pembayaran Diterima",
        content: `Pembayaran tagihan ${invoice.id.slice(-6)} sebesar Rp ${finalAmount.toLocaleString("id-ID")} telah diterima via Xendit.`,
      },
    });
  });

  await logAudit({ entity: "Invoice", entityId: invoiceId, action: "UPDATE", before: { status: invoice.status }, after: { status: "PAID", amount: finalAmount, via: "xendit-webhook" } });
}

async function handleEventPayment(registrationId: string, externalId: string) {
  const registration = await db.eventRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) {
    console.warn("[xendit-webhook] Event registration not found:", registrationId);
    return;
  }
  if (registration.paymentStatus === "PAID") return;

  await db.eventRegistration.update({
    where: { id: registrationId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      externalId,
      paymentMethod: "XENDIT",
    },
  });

  await db.notification.create({
    data: {
      userId: registration.userId,
      type: "PAYMENT",
      title: "Pembayaran Event Berhasil",
      content: `Pembayaran event telah diterima via Xendit. Status registrasi: CONFIRMED.`,
    },
  });

  await logAudit({ entity: "EventRegistration", entityId: registrationId, action: "UPDATE", after: { paymentStatus: "PAID", paymentMethod: "XENDIT", externalId, via: "xendit-webhook" } });
}

async function handlePpdbPayment(registrationId: string, amount: number, externalId: string) {
  const registration = await db.registration.findUnique({ where: { id: registrationId } });
  if (!registration) {
    console.warn("[xendit-webhook] PPDB registration not found:", registrationId);
    return;
  }
  if (registration.paymentStatus === "PAID") return;

  const ppdbAmount = amount || registration.registrationFee || 0;

  await db.$transaction(async (tx) => {
    await tx.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "XENDIT",
        externalId,
        paidAt: new Date(),
        ...(registration.status === "DRAFT" || registration.status === "SUBMITTED"
          ? { status: "WAITING_VERIFICATION" as const }
          : {}),
      },
    });

    if (registration.branchId && ppdbAmount > 0) {
      await tx.branchTransaction.create({
        data: {
          branchId: registration.branchId,
          type: "INCOME",
          category: "Pendaftaran PPDB",
          amount: ppdbAmount,
          note: `Pembayaran PPDB Xendit — ${registration.fullName} (${registration.registrationNo})`,
          createdBy: registration.convertedUserId || "System",
        },
      });
    }

    if (registration.convertedUserId) {
      await tx.notification.create({
        data: {
          userId: registration.convertedUserId,
          type: "PAYMENT",
          title: "Pembayaran PPDB Diterima",
          content: `Pembayaran PPDB untuk ${registration.fullName} telah diterima via Xendit.`,
        },
      });
    }
  });

  await logAudit({ entity: "Registration", entityId: registrationId, action: "UPDATE", after: { paymentStatus: "PAID", paymentMethod: "XENDIT", externalId, via: "xendit-webhook" } });
}
