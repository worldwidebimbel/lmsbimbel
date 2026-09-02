import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const examQuestions = await db.examQuestion.findMany({
    where: { examId },
    include: {
      question: {
        select: { id: true, type: true, content: true, options: true, score: true, difficulty: true, subjectId: true },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(examQuestions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { examId, questionIds } = body as { examId: string; questionIds: string[] };

  if (!examId || !Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: "examId dan questionIds wajib" }, { status: 400 });
  }

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ error: "Exam tidak ditemukan" }, { status: 404 });

  if (session.user.role === "GURU") {
    if (exam.classId) {
      const cls = await db.class.findUnique({ where: { id: exam.classId }, select: { teacherId: true } });
      if (cls?.teacherId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const bankQuestions = await db.question.findMany({ where: { id: { in: questionIds } } });
  if (bankQuestions.length === 0) {
    return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
  }

  const examQuestions = await db.question.findMany({
    where: { examId },
    select: { content: true, order: true },
  });
  const existingContent = new Set(examQuestions.map((q) => q.content));
  const toClone = bankQuestions.filter((q) => !existingContent.has(q.content));

  if (toClone.length === 0) {
    return NextResponse.json({ created: 0, message: "Semua soal sudah terpasang di ujian ini" });
  }

  let order = examQuestions.reduce((max, q) => Math.max(max, q.order), 0) + 1;

  const result = await db.question.createMany({
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
      order: order++,
    })),
  });

  await db.examQuestion.createMany({
    data: toClone.map((q, i) => ({ examId, questionId: q.id, order: i })),
    skipDuplicates: true,
  });

  await logAudit({ entity: "Question", entityId: examId, action: "CREATE", after: { examId, clonedFromBank: toClone.map((q) => q.id), count: result.count } });

  return NextResponse.json({ created: result.count });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const questionId = searchParams.get("questionId");
  if (!examId || !questionId) return NextResponse.json({ error: "examId dan questionId wajib" }, { status: 400 });

  await db.examQuestion.deleteMany({ where: { examId, questionId } });
  await logAudit({ entity: "ExamQuestion", entityId: `${examId}:${questionId}`, action: "DELETE" });
  return NextResponse.json({ success: true });
}
