import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const children = await db.parentChild.findMany({
    where: { parentId: session.user.id },
    select: { childId: true },
  });

  if (children.length === 0) {
    return NextResponse.json([]);
  }

  const childClasses = await db.classStudent.findMany({
    where: { studentId: { in: children.map((c) => c.childId) } },
    select: { classId: true },
  });

  const classIds = childClasses.map((c) => c.classId);
  if (classIds.length === 0) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {
    classId: { in: classIds },
    status: "PUBLISHED",
  };

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
    },
    orderBy: { sessionDate: "desc" },
    take: 50,
  });

  return NextResponse.json(journals);
}
