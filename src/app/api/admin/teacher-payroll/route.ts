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
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (!isSuperAdmin && branchId) where.branchId = branchId;
  if (teacherId) where.teacherId = teacherId;
  if (status) where.status = status;

  const payrolls = await db.teacherPayroll.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { periodStart: "desc" },
  });

  return NextResponse.json(payrolls);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { teacherId, periodStart, periodEnd, ratePerMeeting, ratePerHour } = body;

  if (!teacherId || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "teacherId, periodStart, periodEnd wajib diisi" }, { status: 400 });
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Count meetings (attendance records with HADIR/TERLAMBAT) in period
  const attendances = await db.teacherAttendance.findMany({
    where: {
      teacherId,
      date: { gte: start, lte: end },
      status: { in: ["HADIR", "TERLAMBAT"] },
    },
    select: { checkIn: true, checkOut: true, date: true },
  });

  const totalMeetings = attendances.length;
  let totalHours = 0;
  for (const a of attendances) {
    if (a.checkIn && a.checkOut) {
      totalHours += (a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60);
    }
  }

  const meetingRate = Number(ratePerMeeting ?? 0);
  const hourRate = Number(ratePerHour ?? 0);
  const totalAmount = Math.round(totalMeetings * meetingRate + totalHours * hourRate);

  const payroll = await db.teacherPayroll.create({
    data: {
      teacherId,
      branchId: isSuperAdmin ? (body.branchId ?? null) : branchId,
      periodStart: start,
      periodEnd: end,
      ratePerMeeting: meetingRate,
      ratePerHour: hourRate,
      totalMeetings,
      totalHours: Math.round(totalHours * 100) / 100,
      totalAmount,
      status: "DRAFT",
    },
    include: { teacher: { select: { name: true, email: true } } },
  });

  return NextResponse.json(payroll, { status: 201 });
}
