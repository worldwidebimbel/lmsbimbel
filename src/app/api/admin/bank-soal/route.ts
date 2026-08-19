import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const statsOnly = searchParams.get("stats") === "true";

  const where: Record<string, unknown> = { examId: null };
  if (subjectId) where.subjectId = subjectId;
  if (type) where.type = type;
  if (difficulty) where.difficulty = Number(difficulty);
  if (search) where.content = { contains: search, mode: "insensitive" };

  if (statsOnly) {
    const [total, bySubject, byType, byDifficulty, usedInExams] = await Promise.all([
      db.question.count({ where: { examId: null } }),
      db.question.groupBy({
        by: ["subjectId"],
        where: { examId: null },
        _count: true,
      }),
      db.question.groupBy({
        by: ["type"],
        where: { examId: null },
        _count: true,
      }),
      db.question.groupBy({
        by: ["difficulty"],
        where: { examId: null },
        _count: true,
      }),
      db.examQuestion.count(),
    ]);

    const subjects = await db.subject.findMany({
      select: { id: true, name: true, color: true },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    return NextResponse.json({
      total,
      usedInExams,
      bySubject: bySubject.map((s) => ({
        subjectId: s.subjectId,
        subject: s.subjectId ? subjectMap.get(s.subjectId) : null,
        count: s._count,
      })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      byDifficulty: byDifficulty.map((d) => ({ difficulty: d.difficulty, count: d._count })),
    });
  }

  const questions = await db.question.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, color: true } },
      examQuestions: { select: { examId: true, exam: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { subjectId, type, content, options, correctAnswer, explanation, score, difficulty, tags } = body;

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
      tags: tags ?? null,
    },
    include: { subject: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(question, { status: 201 });
}
