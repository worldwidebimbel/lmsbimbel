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
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (!isSuperAdmin && branchId) {
    where.branchId = branchId;
  }

  if (teacherId) where.teacherId = teacherId;
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
    take: 200,
  });

  return NextResponse.json(journals);
}
