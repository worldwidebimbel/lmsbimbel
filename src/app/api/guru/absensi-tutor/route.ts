import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { teacherId: session.user.id };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const records = await db.teacherAttendance.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action, classId, scheduleId, code, branchId } = body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (action === "check_in" || action === "check_out") {
    let resolvedClassId = classId ?? null;
    let resolvedScheduleId = scheduleId ?? null;
    let resolvedBranchId = branchId ?? null;

    if (code) {
      const cls = await db.class.findFirst({
        where: { id: code, isActive: true },
        select: { id: true, branchId: true },
      });
      if (!cls) {
        return NextResponse.json({ error: "Kode kelas tidak ditemukan" }, { status: 404 });
      }
      resolvedClassId = cls.id;
      resolvedBranchId = cls.branchId;
    }

    if (resolvedClassId && !resolvedBranchId) {
      const cls = await db.class.findUnique({
        where: { id: resolvedClassId },
        select: { branchId: true },
      });
      resolvedBranchId = cls?.branchId ?? null;
    }

    const existing = await db.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: session.user.id, date: today } },
    });

    if (action === "check_in") {
      if (existing?.checkIn) {
        return NextResponse.json({ error: "Sudah check-in hari ini" }, { status: 400 });
      }
      const now = new Date();
      const status = now.getHours() >= 8 ? "TERLAMBAT" : "HADIR";
      const record = await db.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: session.user.id, date: today } },
        create: {
          teacherId: session.user.id,
          classId: resolvedClassId,
          scheduleId: resolvedScheduleId,
          branchId: resolvedBranchId,
          date: today,
          checkIn: now,
          status,
          method: code ? "CODE" : "MANUAL",
        },
        update: {
          checkIn: now,
          status,
          classId: resolvedClassId ?? undefined,
          scheduleId: resolvedScheduleId ?? undefined,
          method: code ? "CODE" : "MANUAL",
        },
      });
      await logAudit({ entity: "TeacherAttendance", entityId: record.id, action: "CREATE", after: { action: "check_in", status } });
      return NextResponse.json(record, { status: 201 });
    } else {
      if (!existing?.checkIn) {
        return NextResponse.json({ error: "Belum check-in" }, { status: 400 });
      }
      if (existing.checkOut) {
        return NextResponse.json({ error: "Sudah check-out hari ini" }, { status: 400 });
      }
      const record = await db.teacherAttendance.update({
        where: { teacherId_date: { teacherId: session.user.id, date: today } },
        data: { checkOut: new Date() },
      });
      await logAudit({ entity: "TeacherAttendance", entityId: record.id, action: "UPDATE", after: { action: "check_out" } });
      return NextResponse.json(record);
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
