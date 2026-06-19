import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { studentId, planId, branchId, amount, dueDate, note } = body;

  if (!studentId || !amount || !dueDate) {
    return NextResponse.json({ error: "studentId, amount, dueDate wajib diisi" }, { status: 400 });
  }

  // Resolve branch: explicit branch, student's default branch, or admin's default branch
  let assignedBranchId = branchId;
  if (!assignedBranchId) {
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: { defaultBranchId: true },
    });
    assignedBranchId = student?.defaultBranchId ?? session.user.defaultBranchId;
  }
  if (session.user.role !== "SUPER_ADMIN" && assignedBranchId !== session.user.defaultBranchId) {
    return NextResponse.json({ error: "Tidak boleh membuat tagihan untuk cabang lain" }, { status: 403 });
  }

  const invoice = await db.invoice.create({
    data: {
      studentId,
      planId: planId || null,
      branchId: assignedBranchId,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      note: note || null,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      plan: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
