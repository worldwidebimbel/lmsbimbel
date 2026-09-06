import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

function verifyMidtransSignature(body: Record<string, unknown>): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;
  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return expected === String(body.signature_key ?? "");
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
  const { order_id, transaction_status, gross_amount, payment_type } = body;

  if (!verifyMidtransSignature(body)) {
    console.warn("[midtrans-callback] Bad signature:", order_id);
    return NextResponse.json({ error: "Bad Signature" }, { status: 400 });
  }

  const successStatuses = ["settlement", "capture"];
  if (!successStatuses.includes(transaction_status)) {
    return NextResponse.json({ ok: true, handled: false });
  }

  if (!order_id) return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });

  const parsed = parseOrderId(order_id);
  if (!parsed) return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });

  if (parsed.prefix === "EVT") {
    const registration = await db.eventRegistration.findUnique({ where: { id: parsed.id } });
    if (!registration) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    if (registration.paymentStatus === "PAID") return NextResponse.json({ ok: true, handled: true });

    await db.eventRegistration.update({
      where: { id: parsed.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        externalId: order_id,
      },
    });

    await logAudit({ entity: "EventRegistration", entityId: parsed.id, action: "UPDATE", after: { paymentStatus: "PAID", externalId: order_id, via: "midtrans-callback" } });

    return NextResponse.json({ ok: true, handled: true });
  }

  if (parsed.prefix === "PPDB") {
    const registration = await db.registration.findUnique({ where: { id: parsed.id } });
    if (!registration) return NextResponse.json({ error: "PPDB registration not found" }, { status: 404 });
    if (registration.paymentStatus === "PAID") return NextResponse.json({ ok: true, handled: true });

    const ppdbAmount = Number(gross_amount) || registration.registrationFee || 0;

    await db.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: parsed.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "MIDTRANS",
          externalId: order_id,
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
            note: `Pembayaran PPDB Midtrans — ${registration.fullName} (${registration.registrationNo})`,
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
            content: `Pembayaran PPDB untuk ${registration.fullName} telah diterima via Midtrans.`,
          },
        });
      }
    });

    await logAudit({ entity: "Registration", entityId: parsed.id, action: "UPDATE", after: { paymentStatus: "PAID", paymentMethod: "MIDTRANS", externalId: order_id, via: "midtrans-callback" } });

    return NextResponse.json({ ok: true, handled: true });
  }

  if (parsed.prefix !== "INV") return NextResponse.json({ error: "Unknown prefix" }, { status: 400 });

  const invoice = await db.invoice.findUnique({ where: { id: parsed.id } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "PAID") return NextResponse.json({ ok: true, handled: true });

  const amount = Number(gross_amount) || invoice.amount;

  await db.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({ where: { invoiceId: parsed.id, method: "MIDTRANS" } });
    if (!existing) {
      await tx.payment.create({
        data: {
          invoiceId: parsed.id,
          userId: invoice.studentId,
          amount,
          method: "MIDTRANS",
          externalId: payment_type ?? null,
          confirmedAt: new Date(),
        },
      });
    }
    await tx.invoice.update({
      where: { id: parsed.id },
      data: { status: "PAID" },
    });

    if (invoice.branchId) {
      await tx.branchTransaction.create({
        data: {
          branchId: invoice.branchId,
          type: "INCOME",
          category: "Pembayaran SPP",
          amount,
          note: `Pembayaran Midtrans — ${invoice.id.slice(-6)} (${order_id})`,
          createdBy: invoice.studentId,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: invoice.studentId,
        type: "PAYMENT",
        title: "Pembayaran Diterima",
        content: `Pembayaran tagihan ${invoice.id.slice(-6)} sebesar Rp ${amount.toLocaleString("id-ID")} telah diterima via Midtrans.`,
      },
    });
  });

  await logAudit({ entity: "Invoice", entityId: parsed.id, action: "UPDATE", before: { status: invoice.status }, after: { status: "PAID", amount, via: "midtrans-callback" } });

  return NextResponse.json({ ok: true, handled: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
