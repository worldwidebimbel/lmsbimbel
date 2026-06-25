import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function parseQueryDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user;

  const search = req.nextUrl.searchParams;
  const start = parseQueryDate(search.get("start"), new Date(new Date().getFullYear(), 0, 1));
  const end = parseQueryDate(search.get("end"), new Date(new Date().getFullYear(), 11, 31));

  const where: Record<string, unknown> = {
    isActive: true,
    OR: [
      { startDate: { gte: start, lte: end } },
      { endDate: { gte: start, lte: end } },
      { AND: [{ startDate: { lte: start } }, { endDate: { gte: end } }] },
    ],
  };

  // Student/teacher/teacher sees branch-specific events only if not SUPER_ADMIN
  if (user?.role && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { defaultBranchId: true },
    });
    if (dbUser?.defaultBranchId) {
      where.branchId = { in: [dbUser.defaultBranchId, null] };
    } else {
      where.branchId = null;
    }
  }

  const events = await db.academicCalendar.findMany({
    where,
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      startDate: true,
      endDate: true,
      isAllDay: true,
      color: true,
      branchId: true,
    },
  });

  return NextResponse.json({ events: JSON.parse(JSON.stringify(events)) });
}
