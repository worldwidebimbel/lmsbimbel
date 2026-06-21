import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (!registration) return NextResponse.json({ error: "Anda belum terdaftar di event ini" }, { status: 403 });
  if (!["CONFIRMED", "PENDING"].includes(registration.status) && registration.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Registrasi belum dikonfirmasi" }, { status: 403 });
  }

  const exam = await db.exam.findFirst({
    where: { eventId: id, isPublished: true },
    include: {
      questions: {
        select: {
          id: true,
          type: true,
          content: true,
          options: true,
          score: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Ujian belum tersedia" }, { status: 404 });

  const now = new Date();
  if (exam.startTime && now < exam.startTime) {
    return NextResponse.json({ error: "Ujian belum dibuka", startTime: exam.startTime }, { status: 425 });
  }
  if (exam.endTime && now > exam.endTime) {
    return NextResponse.json({ error: "Ujian sudah ditutup" }, { status: 410 });
  }

  const attempt = await db.examAttempt.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: session.user.id } },
  });

  const questions = exam.isRandomized
    ? [...exam.questions].sort(() => Math.random() - 0.5)
    : exam.questions;

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
      questionCount: questions.length,
    },
    questions,
    attempt: attempt
      ? {
          isCompleted: attempt.isCompleted,
          score: attempt.score,
          submittedAt: attempt.submittedAt,
        }
      : null,
  });
}
