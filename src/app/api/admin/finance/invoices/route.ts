import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { studentId, planId, amount, dueDate, note } = body;

  if (!studentId || !amount || !dueDate) {
    return NextResponse.json({ error: "studentId, amount, dueDate wajib diisi" }, { status: 400 });
  }

  const invoice = await db.invoice.create({
    data: {
      studentId,
      planId: planId || null,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      note: note || null,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      plan: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
