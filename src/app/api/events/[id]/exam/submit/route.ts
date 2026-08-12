import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (!registration) return NextResponse.json({ error: "Anda belum terdaftar" }, { status: 403 });

  const exam = await db.exam.findFirst({
    where: { eventId: id, isPublished: true },
    include: { questions: true },
  });
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  // Check max attempts
  const completedAttempts = await db.examAttempt.count({
    where: { examId: exam.id, studentId: session.user.id, isCompleted: true },
  });
  if (completedAttempts >= exam.maxAttempts) {
    return NextResponse.json({ error: `Maksimal ${exam.maxAttempts} percobaan tercapai` }, { status: 403 });
  }

  const body = await req.json();
  const answers: Record<string, string> = body.answers ?? {};

  let totalScore = 0;
  let earnedScore = 0;

  for (const question of exam.questions) {
    totalScore += question.score;
    const answer = answers[question.id];
    if (answer && question.correctAnswer && answer === question.correctAnswer) {
      earnedScore += question.score;
    }
  }

  const pct = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
  const score = Math.round(pct * 10) / 10;

  const attempt = await db.examAttempt.create({
    data: {
      examId: exam.id,
      studentId: session.user.id,
      attemptNumber: completedAttempts + 1,
      answers,
      score,
      isCompleted: true,
      submittedAt: new Date(),
    },
  });

  await db.eventRegistration.update({
    where: { id: registration.id },
    data: { score, status: "ATTENDED" },
  });

  await recalculateRankings(id);

  return NextResponse.json({
    success: true,
    score,
    passed: score >= exam.passingScore,
    attempt,
  });
}

async function recalculateRankings(eventId: string) {
  const registrations = await db.eventRegistration.findMany({
    where: { eventId, score: { not: null } },
    orderBy: { score: "desc" },
    select: { id: true },
  });

  await db.$transaction(
    registrations.map((r, i) =>
      db.eventRegistration.update({
        where: { id: r.id },
        data: { rank: i + 1 },
      })
    )
  );
}
