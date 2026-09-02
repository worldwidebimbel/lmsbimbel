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

async function resolveEvent(id: string, branchId: string | null, isSuperAdmin: boolean) {
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return null;
  if (!isSuperAdmin && branchId && event.branchId !== branchId) return null;
  return event;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exams = await db.exam.findMany({
    where: { eventId: id },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, duration, startTime, endTime, isRandomized, passingScore } = body;

  if (!title || !duration) {
    return NextResponse.json({ error: "Judul dan durasi wajib diisi" }, { status: 400 });
  }

  const exam = await db.exam.create({
    data: {
      title,
      description: description ?? null,
      eventId: id,
      duration: Number(duration),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isRandomized: Boolean(isRandomized),
      passingScore: Number(passingScore ?? 60),
      isPublished: false,
    },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  await logAudit({ entity: "Exam", entityId: exam.id, action: "CREATE", after: { title, eventId: id } });
  return NextResponse.json(exam, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { examId, title, description, duration, startTime, endTime, isRandomized, shuffleOptions, passingScore, isPublished } = body;

  if (!examId) return NextResponse.json({ error: "examId wajib diisi" }, { status: 400 });

  const exam = await db.exam.findFirst({ where: { id: examId, eventId: id } });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const updated = await db.exam.update({
    where: { id: exam.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description ?? null }),
      ...(duration !== undefined && { duration: Number(duration) }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
      ...(isRandomized !== undefined && { isRandomized: Boolean(isRandomized) }),
      ...(shuffleOptions !== undefined && { shuffleOptions: Boolean(shuffleOptions) }),
      ...(passingScore !== undefined && { passingScore: Number(passingScore) }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
    },
  });

  await logAudit({ entity: "Exam", entityId: examId, action: "UPDATE", after: { title, isPublished } });
  return NextResponse.json(updated);
}
