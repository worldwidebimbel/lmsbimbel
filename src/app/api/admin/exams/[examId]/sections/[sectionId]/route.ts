import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ examId: string; sectionId: string }> }) {
  const { examId, sectionId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, duration, order } = body;

  const section = await db.examSection.update({
    where: { id: sectionId, examId },
    data: {
      ...(name !== undefined && { name }),
      ...(duration !== undefined && { duration: Number(duration) }),
      ...(order !== undefined && { order: Number(order) }),
    },
  });

  return NextResponse.json(section);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ examId: string; sectionId: string }> }) {
  const { examId, sectionId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.examSection.delete({ where: { id: sectionId, examId } });
  return NextResponse.json({ success: true });
}
