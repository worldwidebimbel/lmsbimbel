import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { amount, method, proofUrl } = body;

  const invoice = await db.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [payment] = await db.$transaction([
    db.payment.create({
      data: {
        invoiceId: id,
        userId: session.user.id,
        amount: Number(amount ?? invoice.amount),
        method: method ?? "CASH",
        proofUrl: proofUrl ?? null,
        confirmedAt: new Date(),
        confirmedBy: session.user.id,
      },
    }),
    db.invoice.update({
      where: { id },
      data: { status: "PAID" },
    }),
  ]);

  return NextResponse.json(payment, { status: 201 });
}
