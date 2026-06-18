import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: examId } = await params;
  const body = await req.json();
  const { questionIds } = body as { questionIds: string[] };

  if (!questionIds?.length) {
    return NextResponse.json({ error: "questionIds wajib diisi" }, { status: 400 });
  }

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { class: { select: { teacherId: true } } },
  });

  if (!exam || exam.class.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Ujian tidak ditemukan atau bukan milik kamu" }, { status: 404 });
  }

  const bankQuestions = await db.question.findMany({
    where: { id: { in: questionIds } },
  });

  const created = await db.question.createMany({
    data: bankQuestions.map((q) => ({
      examId,
      subjectId: q.subjectId,
      type: q.type,
      content: q.content,
      options: q.options ?? undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      score: q.score,
      difficulty: q.difficulty,
    })),
  });

  return NextResponse.json({ imported: created.count }, { status: 201 });
}
