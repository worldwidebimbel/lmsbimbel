import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const { isSuperAdmin, branchId } = await getBranchScope();

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (classId) where.component = { classId };

  if (!isSuperAdmin && branchId) {
    where.component = { ...(where.component as object || {}), class: { branchId } };
  }

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

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { grades } = body as {
    grades: { studentId: string; componentId: string; score: number; note?: string }[];
  };

  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return NextResponse.json({ error: "grades wajib diisi" }, { status: 400 });
  }

  const componentIds = [...new Set(grades.map((g) => g.componentId))];
  const components = await db.gradeComponent.findMany({
    where: { id: { in: componentIds } },
    include: { class: { select: { branchId: true } } },
  });

  if (!isSuperAdmin && branchId) {
    const outOfBranch = components.some((c) => c.class.branchId !== branchId);
    if (outOfBranch) {
      return NextResponse.json({ error: "Forbidden: komponen nilai di luar cabang" }, { status: 403 });
    }
  }

  const existingGrades = await db.grade.findMany({
    where: {
      studentId: { in: grades.map((g) => g.studentId) },
      componentId: { in: grades.map((g) => g.componentId) },
      isLocked: true,
    },
    select: { studentId: true, componentId: true },
  });
  const lockedSet = new Set(existingGrades.map((g) => `${g.studentId}_${g.componentId}`));
  const unlockedGrades = grades.filter((g) => !lockedSet.has(`${g.studentId}_${g.componentId}`));
  const lockedCount = grades.length - unlockedGrades.length;

  if (unlockedGrades.length === 0) {
    return NextResponse.json({ error: "Semua nilai terkunci. Hubungi admin untuk membuka kunci." }, { status: 403 });
  }

  const results = await Promise.all(
    unlockedGrades.map((g) =>
      db.grade.upsert({
        where: { studentId_componentId: { studentId: g.studentId, componentId: g.componentId } },
        create: { studentId: g.studentId, componentId: g.componentId, score: g.score, note: g.note },
        update: { score: g.score, note: g.note },
      })
    )
  );

  for (const g of unlockedGrades) {
    await logAudit({
      entity: "Grade",
      entityId: `${g.studentId}_${g.componentId}`,
      action: "UPSERT",
      after: { studentId: g.studentId, componentId: g.componentId, score: g.score },
    });
  }

  return NextResponse.json({ count: results.length, locked: lockedCount });
}
