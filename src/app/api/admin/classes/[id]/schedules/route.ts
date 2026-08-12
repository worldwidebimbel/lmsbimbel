import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkScheduleConflict } from "@/lib/schedule-conflict";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const schedules = await db.schedule.findMany({
    where: { classId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { roomRel: { select: { id: true, name: true } } },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, roomId, teacherId, startDate, endDate } = body;

  if (!dayOfWeek || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, endTime wajib" }, { status: 400 });
  }

  const classData = await db.class.findUnique({
    where: { id },
    select: { id: true, name: true, teacherId: true, maxStudents: true, branchId: true },
  });
  if (!classData) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  const effectiveTeacherId = teacherId ?? classData.teacherId;
  const studentCount = await db.classStudent.count({ where: { classId: id } });

  const conflictResult = await checkScheduleConflict({
    classId: id,
    dayOfWeek,
    startTime,
    endTime,
    teacherId: effectiveTeacherId,
    roomId: roomId ?? null,
    classStudentCount: studentCount,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  });

  if (conflictResult.hasConflict) {
    return NextResponse.json(
      {
        error: "Jadwal bentrok",
        conflicts: conflictResult.conflicts,
      },
      { status: 409 }
    );
  }

  const schedule = await db.schedule.create({
    data: {
      classId: id,
      dayOfWeek,
      startTime,
      endTime,
      roomId: roomId ?? null,
      teacherId: effectiveTeacherId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  await logAudit({
    entity: "Schedule",
    entityId: schedule.id,
    action: "CREATE",
    after: { classId: id, dayOfWeek, startTime, endTime, roomId, teacherId: effectiveTeacherId },
  });

  return NextResponse.json(schedule, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { scheduleId } = body;
  if (!scheduleId) return NextResponse.json({ error: "scheduleId wajib" }, { status: 400 });

  const schedule = await db.schedule.findUnique({
    where: { id: scheduleId },
    select: { id: true, classId: true, dayOfWeek: true, startTime: true, endTime: true },
  });
  if (!schedule) {
    return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 });
  }

  await db.schedule.delete({ where: { id: scheduleId } });

  await logAudit({
    entity: "Schedule",
    entityId: scheduleId,
    action: "DELETE",
    before: schedule,
  });

  return NextResponse.json({ success: true });
}
