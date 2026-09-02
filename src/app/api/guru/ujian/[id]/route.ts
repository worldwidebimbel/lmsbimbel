import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

async function getExamWithBranch(id: string) {
  const { isSuperAdmin, branchId } = await getBranchScope();
  const exam = await db.exam.findUnique({
    where: { id },
    include: { class: { select: { branchId: true } } },
  });
  if (!exam) return { exam: null, allowed: false };
  if (!isSuperAdmin && branchId && exam.class?.branchId !== branchId) {
    return { exam, allowed: false };
  }
  return { exam, allowed: true };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { allowed } = await getExamWithBranch(id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      questions: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } },
      questionGroups: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } },
      _count: { select: { attempts: true } },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exam);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { allowed } = await getExamWithBranch(id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const exam = await db.exam.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.duration !== undefined && { duration: Number(body.duration) }),
      ...(body.startTime !== undefined && { startTime: body.startTime ? new Date(body.startTime) : null }),
      ...(body.endTime !== undefined && { endTime: body.endTime ? new Date(body.endTime) : null }),
      ...(body.isRandomized !== undefined && { isRandomized: Boolean(body.isRandomized) }),
      ...(body.shuffleOptions !== undefined && { shuffleOptions: Boolean(body.shuffleOptions) }),
      ...(body.passingScore !== undefined && { passingScore: Number(body.passingScore) }),
      ...(body.isPublished !== undefined && { isPublished: Boolean(body.isPublished) }),
    },
  });

  await logAudit({ entity: "Exam", entityId: id, action: "UPDATE", after: { title: body.title, isPublished: body.isPublished } });
  return NextResponse.json(exam);
}
