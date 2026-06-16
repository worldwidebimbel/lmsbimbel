import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (classId) where.component = { classId };

  const grades = await db.grade.findMany({
    where,
    include: {
      component: { select: { id: true, name: true, weight: true, period: true } },
      student: { select: { id: true, name: true } },
    },
    orderBy: { component: { order: "asc" } },
  });

  return NextResponse.json(grades);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { grades } = body as {
    grades: { studentId: string; componentId: string; score: number; note?: string }[];
  };

  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return NextResponse.json({ error: "grades wajib diisi" }, { status: 400 });
  }

  const results = await Promise.all(
    grades.map((g) =>
      db.grade.upsert({
        where: { studentId_componentId: { studentId: g.studentId, componentId: g.componentId } },
        create: { studentId: g.studentId, componentId: g.componentId, score: g.score, note: g.note },
        update: { score: g.score, note: g.note },
      })
    )
  );

  return NextResponse.json({ count: results.length });
}
