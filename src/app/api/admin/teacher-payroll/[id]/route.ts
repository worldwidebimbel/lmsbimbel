import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, assertBranchAccess } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";
import { sendInAppNotification } from "@/lib/notification-helper";

const ALLOWED_STATUS = ["DRAFT", "APPROVED", "PAID", "CANCELLED"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, note } = body;

  if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const current = await db.teacherPayroll.findUnique({ where: { id }, select: { id: true, branchId: true, status: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scope = await getBranchScope();
  if (!assertBranchAccess(current.branchId, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (current.status === "PAID" && status !== undefined && status !== "PAID") {
    return NextResponse.json({ error: "Payroll sudah dibayar dan tidak dapat diubah statusnya" }, { status: 409 });
  }

  const payroll = await db.teacherPayroll.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(note !== undefined && { note }),
      ...(status === "APPROVED" && {
        approvedBy: session.user.id,
        approvedAt: new Date(),
      }),
      ...(status === "PAID" && { paidAt: new Date() }),
    },
    include: { teacher: { select: { id: true, name: true } } },
  });

  if (status === "APPROVED" || status === "PAID") {
    await sendInAppNotification(
      payroll.teacherId,
      "Status Payroll Diperbarui",
      `Payroll Anda telah ${status === "APPROVED" ? "disetujui" : "dibayar"} (Rp ${payroll.totalAmount.toLocaleString("id-ID")})`,
    );
  }

  await logAudit({
    action: "UPDATE",
    entity: "TeacherPayroll",
    entityId: id,
    after: { status, teacherName: payroll.teacher.name },
  });

  return NextResponse.json(payroll);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const current = await db.teacherPayroll.findUnique({ where: { id }, select: { id: true, branchId: true, status: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (current.status === "PAID") {
    return NextResponse.json({ error: "Payroll sudah dibayar dan tidak dapat dihapus" }, { status: 409 });
  }

  const scope = await getBranchScope();
  if (!assertBranchAccess(current.branchId, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.teacherPayroll.delete({ where: { id } });
  await logAudit({ entity: "TeacherPayroll", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
