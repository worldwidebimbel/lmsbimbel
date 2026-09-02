import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

async function resolveExam(examId: string, branchId: string | null, isSuperAdmin: boolean) {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { class: { select: { branchId: true } }, event: { select: { branchId: true } } },
  });
  if (!exam) return null;
  if (!isSuperAdmin && branchId) {
    const examBranchId = exam.class?.branchId ?? exam.event?.branchId;
    if (examBranchId && examBranchId !== branchId) return null;
  }
  return exam;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ examId: string; groupId: string }> }) {
  const { examId, groupId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { type, title, passageText, audioUrl, maxPlayCount, timeLimit, order } = body;

  const group = await db.questionGroup.update({
    where: { id: groupId, examId },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title: title ?? null }),
      ...(passageText !== undefined && { passageText: passageText ?? null }),
      ...(audioUrl !== undefined && { audioUrl: audioUrl ?? null }),
      ...(maxPlayCount !== undefined && { maxPlayCount: maxPlayCount ? Number(maxPlayCount) : null }),
      ...(timeLimit !== undefined && { timeLimit: timeLimit ? Number(timeLimit) : null }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });

  await logAudit({ entity: "QuestionGroup", entityId: groupId, action: "UPDATE" });
  return NextResponse.json(group);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ examId: string; groupId: string }> }) {
  const { examId, groupId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.questionGroup.delete({ where: { id: groupId, examId } });
  await logAudit({ entity: "QuestionGroup", entityId: groupId, action: "DELETE" });
  return NextResponse.json({ success: true });
}
