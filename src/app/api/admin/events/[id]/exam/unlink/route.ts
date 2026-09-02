import { NextRequest, NextResponse } from "next/server";
import { isAdminRole, hasPermission } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

async function canManageEvents(role: string | undefined): Promise<boolean> {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  return hasPermission(role, "event.manage");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && branchId && event.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { examId } = body;
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const exam = await db.exam.findFirst({ where: { id: examId, eventId: id } });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  await db.exam.update({
    where: { id: examId },
    data: { eventId: null },
  });

  await logAudit({ entity: "Exam", entityId: examId, action: "UPDATE", after: { unlinkedFromEventId: id } });
  return NextResponse.json({ success: true });
}
