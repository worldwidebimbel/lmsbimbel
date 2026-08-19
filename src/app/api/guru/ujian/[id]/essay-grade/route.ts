import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id },
    select: { id: true, title: true, passingScore: true },
  });
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = await db.examQuestion.findMany({
    where: { examId: id, question: { type: "ESSAY" } },
    select: { id: true, score: true, question: { select: { id: true, content: true, type: true } } },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    return NextResponse.json({ exam, essayQuestions: [], attempts: [] });
  }

  const attempts = await db.examAttempt.findMany({
    where: { examId: id, isCompleted: true },
    include: {
      student: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const essayAttempts = attempts.map((a) => ({
    id: a.id,
    studentId: a.student.id,
    studentName: a.student.name,
    score: a.score,
    answers: a.answers as Record<string, string> | null,
    submittedAt: a.submittedAt,
  }));

  return NextResponse.json({
    exam,
    essayQuestions: questions.map((q) => ({
      id: q.question.id,
      examQuestionId: q.id,
      content: q.question.content,
      score: q.score ?? 1,
    })),
    attempts: essayAttempts,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { attemptId, essayScores } = body as {
    attemptId: string;
    essayScores: Record<string, number>;
  };

  if (!attemptId || !essayScores) {
    return NextResponse.json({ error: "attemptId dan essayScores wajib diisi" }, { status: 400 });
  }

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: { include: { questions: true } } },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.examId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let totalScore = 0;
  let maxScore = 0;

  for (const q of attempt.exam.questions) {
    maxScore += q.score;
    const studentAnswer = (attempt.answers as Record<string, string>)?.[q.id];

    if (q.type === "ESSAY") {
      const essayScore = essayScores[q.id];
      if (essayScore !== undefined) {
        totalScore += Math.min(Math.max(0, essayScore), q.score);
      }
    } else {
      if (studentAnswer && studentAnswer === q.correctAnswer) {
        totalScore += q.score;
      }
    }
  }

  const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const updated = await db.examAttempt.update({
    where: { id: attemptId },
    data: { score: percentScore },
  });

  return NextResponse.json({ score: percentScore, attempt: updated });
}
