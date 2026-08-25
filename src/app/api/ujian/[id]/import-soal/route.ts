import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
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

  if (!exam) {
    return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
  }

  if (session.user.role === "GURU" && exam.class?.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Ujian bukan milik kamu" }, { status: 403 });
  }

  const bankQuestions = await db.question.findMany({
    where: { id: { in: questionIds } },
  });

  const examQuestions = await db.question.findMany({
    where: { examId },
    select: { content: true, order: true },
  });
  const existingContent = new Set(examQuestions.map((q) => q.content));
  const toClone = bankQuestions.filter((q) => !existingContent.has(q.content));

  if (toClone.length === 0) {
    return NextResponse.json({ imported: 0, message: "Semua soal sudah ada di ujian ini" });
  }

  let nextOrder = examQuestions.reduce((max, q) => Math.max(max, q.order), 0) + 1;

  const created = await db.question.createMany({
    data: toClone.map((q) => ({
      examId,
      subjectId: q.subjectId,
      type: q.type,
      content: q.content,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      videoUrl: q.videoUrl,
      options: q.options ?? undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      score: q.score,
      difficulty: q.difficulty,
      tags: q.tags ?? undefined,
      order: nextOrder++,
    })),
  });

  await db.examQuestion.createMany({
    data: toClone.map((q, i) => ({ examId, questionId: q.id, order: i })),
    skipDuplicates: true,
  });

  return NextResponse.json({ imported: created.count }, { status: 201 });
}
