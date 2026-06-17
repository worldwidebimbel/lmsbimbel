import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id, isPublished: true },
    include: {
      class: { select: { name: true, subject: { select: { name: true, color: true } } } },
      questions: {
        select: { id: true, type: true, content: true, options: true, score: true },
        orderBy: { createdAt: "asc" },
      },
      attempts: {
        where: { studentId: session.user.id },
        select: { id: true, score: true, isCompleted: true, submittedAt: true, answers: true },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (exam.isRandomized) {
    exam.questions = exam.questions.sort(() => Math.random() - 0.5);
  }

  return NextResponse.json(exam);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { answers } = body;

  const exam = await db.exam.findUnique({
    where: { id, isPublished: true },
    include: { questions: true },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.examAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: session.user.id } },
  });
  if (existing?.isCompleted) {
    return NextResponse.json({ error: "Ujian sudah dikerjakan" }, { status: 400 });
  }

  let totalScore = 0;
  let maxScore = 0;

  for (const q of exam.questions) {
    maxScore += q.score;
    const studentAnswer = answers?.[q.id];
    if (studentAnswer !== undefined && studentAnswer === q.correctAnswer) {
      totalScore += q.score;
    }
  }

  const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const attempt = await db.examAttempt.upsert({
    where: { examId_studentId: { examId: id, studentId: session.user.id } },
    create: {
      examId: id,
      studentId: session.user.id,
      answers: answers ?? {},
      score: percentScore,
      isCompleted: true,
      submittedAt: new Date(),
    },
    update: {
      answers: answers ?? {},
      score: percentScore,
      isCompleted: true,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({
    score: percentScore,
    passed: percentScore >= exam.passingScore,
    passingScore: exam.passingScore,
    attempt,
  });
}
