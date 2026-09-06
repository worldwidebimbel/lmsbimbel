import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { teacherIds, periodStart, periodEnd, ratePerMeeting, ratePerHour } = body;

  if (!teacherIds?.length || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "teacherIds, periodStart, periodEnd wajib diisi" }, { status: 400 });
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const meetingRate = Number(ratePerMeeting ?? 0);
  const hourRate = Number(ratePerHour ?? 0);

  const results: { teacherId: string; payrollId: string; totalMeetings: number; totalAmount: number }[] = [];

  for (const teacherId of teacherIds as string[]) {
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

    const totalAmount = Math.round(totalMeetings * meetingRate + totalHours * hourRate);

    const existing = await db.teacherPayroll.findFirst({
      where: { teacherId, periodStart: start, periodEnd: end },
    });

    const payrollData = {
      branchId: isSuperAdmin ? (body.branchId ?? null) : branchId,
      ratePerMeeting: meetingRate,
      ratePerHour: hourRate,
      totalMeetings,
      totalHours: Math.round(totalHours * 100) / 100,
      totalAmount,
    };

    const payroll = existing && existing.status === "DRAFT"
      ? await db.teacherPayroll.update({ where: { id: existing.id }, data: payrollData })
      : existing
        ? null // sudah APPROVED/PAID — lewati, jangan dobel/ubah
        : await db.teacherPayroll.create({
            data: {
              teacherId,
              periodStart: start,
              periodEnd: end,
              ...payrollData,
              status: "DRAFT",
            },
          });

    if (payroll) {
      results.push({ teacherId, payrollId: payroll.id, totalMeetings, totalAmount });
    }
  }

  await logAudit({ entity: "TeacherPayroll", entityId: "bulk", action: "CREATE", after: { count: results.length, periodStart, periodEnd } });
  return NextResponse.json({ generated: results.length, results }, { status: 201 });
}
