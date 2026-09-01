import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const classWhere = branchId
    ? { teacherId: session.user.id, branchId }
    : { teacherId: session.user.id };

  // Exams linked to classes taught by this guru OR exams linked to events in their branch
  const exams = await db.exam.findMany({
    where: {
      OR: [
        { class: classWhere },
        ...(branchId ? [{ event: { branchId } }] : []),
      ],
    },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      event: { select: { id: true, title: true, type: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { title, description, classId, eventId, duration, startTime, endTime, isRandomized, passingScore, maxAttempts, scoringMode, materialId } = body;

  if (!title || !duration) {
    return NextResponse.json({ error: "title, duration wajib diisi" }, { status: 400 });
  }
  if (!classId && !eventId) {
    return NextResponse.json({ error: "classId atau eventId wajib diisi" }, { status: 400 });
  }

  let resolvedClassId: string | undefined;
  let resolvedEventId: string | undefined;

  if (classId) {
    const cls = await db.class.findUnique({ where: { id: classId }, select: { branchId: true } });
    if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    if (!isSuperAdmin && branchId && cls.branchId !== branchId) {
      return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
    }
    resolvedClassId = classId;
  }

  if (eventId) {
    const evt = await db.event.findUnique({ where: { id: eventId }, select: { branchId: true } });
    if (!evt) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
    if (!isSuperAdmin && branchId && evt.branchId !== branchId) {
      return NextResponse.json({ error: "Forbidden: event di luar cabang" }, { status: 403 });
    }
    resolvedEventId = eventId;
  }

  const exam = await db.exam.create({
    data: {
      title,
      description: description ?? null,
      classId: resolvedClassId ?? null,
      eventId: resolvedEventId ?? null,
      materialId: materialId ?? null,
      duration: Number(duration),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isRandomized: Boolean(isRandomized),
      passingScore: Number(passingScore ?? 60),
      maxAttempts: Number(maxAttempts ?? 1),
      scoringMode: scoringMode ?? "SUM",
    },
  });

  return NextResponse.json(exam, { status: 201 });
}
