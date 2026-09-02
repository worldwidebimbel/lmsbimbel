import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const subjectId = searchParams.get("subjectId");

  if (!examId && !subjectId) {
    return NextResponse.json({ error: "examId atau subjectId wajib diisi" }, { status: 400 });
  }

  let questionIds: string[] = [];

  if (examId) {
    const questions = await db.question.findMany({
      where: { examId },
      select: { id: true, content: true, type: true, difficulty: true, score: true },
    });
    questionIds = questions.map((q) => q.id);

    const attempts = await db.examAttempt.findMany({
      where: { examId, isCompleted: true },
      select: { answers: true, score: true },
    });

    const stats = questions.map((q) => {
      let correct = 0;
      let wrong = 0;
      let total = 0;

      for (const att of attempts) {
        const answers = att.answers as Record<string, { correct?: boolean; isCorrect?: boolean; studentAnswer?: string }> | null;
        if (!answers) continue;
        const ans = answers[q.id];
        if (!ans) continue;
        total++;
        const isCorrect = ans.correct ?? ans.isCorrect ?? false;
        if (isCorrect) correct++;
        else wrong++;
      }

      const correctRate = total > 0 ? (correct / total) * 100 : 0;
      const actualDifficulty = correctRate >= 70 ? 1 : correctRate >= 40 ? 2 : 3;

      return {
        questionId: q.id,
        content: q.content.length > 80 ? q.content.slice(0, 80) + "..." : q.content,
        type: q.type,
        declaredDifficulty: q.difficulty,
        actualDifficulty,
        totalAttempts: total,
        correct,
        wrong,
        correctRate: Math.round(correctRate * 10) / 10,
      };
    });

    return NextResponse.json({
      totalQuestions: stats.length,
      totalAttempts: attempts.length,
      stats: stats.sort((a, b) => a.correctRate - b.correctRate),
    });
  }

  // Subject-level stats from bank soal
  const questions = await db.question.findMany({
    where: { subjectId, examId: null },
    select: { id: true, content: true, type: true, difficulty: true },
  });
  questionIds = questions.map((q) => q.id);

  const examsWithSubject = await db.exam.findMany({
    where: { class: { subjectId: subjectId! } },
    select: { id: true },
  });

  const attempts = await db.examAttempt.findMany({
    where: { examId: { in: examsWithSubject.map((e) => e.id) }, isCompleted: true },
    select: { answers: true },
  });

  const stats = questions.map((q) => {
    let correct = 0;
    let total = 0;

    for (const att of attempts) {
      const answers = att.answers as Record<string, { correct?: boolean; isCorrect?: boolean }> | null;
      if (!answers) continue;
      const ans = answers[q.id];
      if (!ans) continue;
      total++;
      if (ans.correct ?? ans.isCorrect ?? false) correct++;
    }

    const correctRate = total > 0 ? (correct / total) * 100 : 0;
    const actualDifficulty = correctRate >= 70 ? 1 : correctRate >= 40 ? 2 : 3;

    return {
      questionId: q.id,
      content: q.content.length > 80 ? q.content.slice(0, 80) + "..." : q.content,
      type: q.type,
      declaredDifficulty: q.difficulty,
      actualDifficulty,
      totalAttempts: total,
      correct,
      correctRate: Math.round(correctRate * 10) / 10,
    };
  });

  return NextResponse.json({
    totalQuestions: stats.length,
    totalAttempts: attempts.length,
    stats: stats.sort((a, b) => a.correctRate - b.correctRate),
  });
}
