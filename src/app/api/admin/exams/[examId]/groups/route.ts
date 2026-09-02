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

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groups = await db.questionGroup.findMany({
    where: { examId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, content: true, type: true, order: true, score: true },
      },
      _count: { select: { questions: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { type, title, passageText, audioUrl, maxPlayCount, timeLimit, order } = body;

  if (!type) {
    return NextResponse.json({ error: "Tipe stimulus wajib diisi (AUDIO/READING)" }, { status: 400 });
  }

  const maxOrder = await db.questionGroup.aggregate({
    where: { examId },
    _max: { order: true },
  });

  const group = await db.questionGroup.create({
    data: {
      examId,
      type,
      title: title ?? null,
      passageText: passageText ?? null,
      audioUrl: audioUrl ?? null,
      maxPlayCount: maxPlayCount ? Number(maxPlayCount) : null,
      timeLimit: timeLimit ? Number(timeLimit) : null,
      order: order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  await logAudit({ entity: "QuestionGroup", entityId: group.id, action: "CREATE", after: { examId, type } });
  return NextResponse.json(group, { status: 201 });
}
