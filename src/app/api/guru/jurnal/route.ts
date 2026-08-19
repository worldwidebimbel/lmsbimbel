import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (session.user.role === "GURU") {
    where.teacherId = session.user.id;
  } else if (!isSuperAdmin && branchId) {
    where.branchId = branchId;
  }

  if (classId) where.classId = classId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) (where.sessionDate as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.sessionDate as Record<string, unknown>).lte = new Date(endDate);
  }

  const journals = await db.teachingJournal.findMany({
    where,
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      teacher: { select: { id: true, name: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
    },
    orderBy: { sessionDate: "desc" },
  });

  return NextResponse.json(journals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { classId, scheduleId, sessionDate, startTime, endTime, material, activity, obstacles, solution, studentCount, status } = body;

  if (!classId || !activity || !sessionDate || !startTime || !endTime) {
    return NextResponse.json({ error: "classId, activity, sessionDate, startTime, endTime wajib diisi" }, { status: 400 });
  }

  const cls = await db.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true, branchId: true },
  });

  if (!cls) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  if (session.user.role === "GURU" && cls.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Bukan kelas Anda" }, { status: 403 });
  }

  const journal = await db.teachingJournal.create({
    data: {
      classId,
      teacherId: session.user.role === "GURU" ? session.user.id : cls.teacherId,
      scheduleId: scheduleId ?? null,
      branchId: cls.branchId,
      sessionDate: new Date(sessionDate),
      startTime,
      endTime,
      material: material ?? null,
      activity,
      obstacles: obstacles ?? null,
      solution: solution ?? null,
      studentCount: studentCount ?? 0,
      status: status ?? "DRAFT",
    },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(journal, { status: 201 });
}
