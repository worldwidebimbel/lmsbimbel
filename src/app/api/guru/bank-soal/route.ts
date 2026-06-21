import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const classWhere = branchId
    ? { teacherId: session.user.id, branchId }
    : { teacherId: session.user.id };
  const teacherClasses = await db.class.findMany({
    where: classWhere,
    select: { id: true, subjectId: true },
  });
  const examIds = (await db.exam.findMany({
    where: { classId: { in: teacherClasses.map((c) => c.id) } },
    select: { id: true },
  })).map((e) => e.id);

  const where: Record<string, unknown> = {
    OR: [
      { examId: null, subjectId: subjectId ?? { not: null } },
      { examId: { in: examIds } },
    ],
  };
  if (subjectId) {
    where.OR = [
      { examId: null, subjectId },
      { examId: { in: examIds }, exam: { class: { subjectId } } },
    ];
  }

  const questions = await db.question.findMany({
    where: subjectId
      ? {
          OR: [
            { examId: null, subjectId },
            { examId: { in: examIds } },
          ],
        }
      : { examId: null },
    include: { subject: { select: { name: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { subjectId, type, content, options, correctAnswer, explanation, score, difficulty } = body;

  if (!content || !type) {
    return NextResponse.json({ error: "content dan type wajib diisi" }, { status: 400 });
  }

  const question = await db.question.create({
    data: {
      subjectId: subjectId ?? null,
      examId: null,
      type,
      content,
      options: options ?? null,
      correctAnswer: correctAnswer ?? null,
      explanation: explanation ?? null,
      score: score ?? 1,
      difficulty: difficulty ?? 2,
    },
    include: { subject: { select: { name: true, color: true } } },
  });

  return NextResponse.json(question, { status: 201 });
}
