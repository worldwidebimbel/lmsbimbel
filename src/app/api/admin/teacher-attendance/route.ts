import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  if (!isSuperAdmin && branchId) where.branchId = branchId;
  if (teacherId) where.teacherId = teacherId;
  if (date) where.date = new Date(date);
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const records = await db.teacherAttendance.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { teacherId, classId, scheduleId, date, checkIn, checkOut, status, method, note } = body;

  if (!teacherId || !date) {
    return NextResponse.json({ error: "teacherId dan date wajib diisi" }, { status: 400 });
  }

  const record = await db.teacherAttendance.upsert({
    where: { teacherId_date: { teacherId, date: new Date(date) } },
    create: {
      teacherId,
      classId: classId ?? null,
      scheduleId: scheduleId ?? null,
      branchId: isSuperAdmin ? (body.branchId ?? null) : branchId,
      date: new Date(date),
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status: status ?? "HADIR",
      method: method ?? null,
      note: note ?? null,
    },
    update: {
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      status: status ?? undefined,
      note: note ?? undefined,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
