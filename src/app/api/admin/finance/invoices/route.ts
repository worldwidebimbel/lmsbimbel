import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { studentId, planId, branchId, amount, dueDate, note, enableOnlinePayment, onlinePaymentMethod } = body;

  if (!studentId || !amount || !dueDate) {
    return NextResponse.json({ error: "studentId, amount, dueDate wajib diisi" }, { status: 400 });
  }
  const onlinePayment = Boolean(enableOnlinePayment);
  const provider = ["MIDTRANS", "XENDIT"].includes(onlinePaymentMethod) ? onlinePaymentMethod : "MIDTRANS";

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

  let meetingCount: number | null = null;
  if (planId) {
    const plan = await db.billingPlan.findUnique({ where: { id: planId }, select: { type: true, meetingCount: true } });
    if (plan?.type === "MEETING_PACKAGE" && plan.meetingCount) {
      meetingCount = plan.meetingCount;
    }
  }

  const invoice = await db.invoice.create({
    data: {
      studentId,
      planId: planId || null,
      branchId: assignedBranchId,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      note: note || null,
      meetingCount,
      enableOnlinePayment: onlinePayment,
      onlinePaymentMethod: onlinePayment ? provider : null,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      plan: { select: { id: true, name: true, type: true, meetingCount: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  await logAudit({
    entity: "Invoice",
    entityId: invoice.id,
    action: "CREATE",
    after: { studentId, amount: Number(amount), dueDate, branchId: assignedBranchId, planId: planId || null },
  });

  return NextResponse.json(invoice, { status: 201 });
}
