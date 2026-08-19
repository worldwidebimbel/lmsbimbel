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

export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(examId, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sections = await db.examSection.findMany({
    where: { examId },
    include: {
      questions: { orderBy: { order: "asc" }, select: { id: true, content: true, type: true, order: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(sections);
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
  const { name, duration, order } = body;

  if (!name || !duration) {
    return NextResponse.json({ error: "Nama dan durasi section wajib diisi" }, { status: 400 });
  }

  const maxOrder = await db.examSection.aggregate({
    where: { examId },
    _max: { order: true },
  });

  const section = await db.examSection.create({
    data: {
      examId,
      name,
      duration: Number(duration),
      order: order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
