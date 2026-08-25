import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";
import { sendInAppNotification } from "@/lib/notification-helper";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, note } = body;

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
  await db.teacherPayroll.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
