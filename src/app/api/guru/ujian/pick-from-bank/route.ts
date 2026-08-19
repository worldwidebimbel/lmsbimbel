import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const existing = await db.examQuestion.findMany({
    where: { examId, questionId: { in: questionIds } },
    select: { questionId: true },
  });
  const existingSet = new Set(existing.map((e) => e.questionId));

  const maxOrder = await db.examQuestion.aggregate({
    where: { examId },
    _max: { order: true },
  });

  let order = (maxOrder._max.order ?? 0) + 1;
  const toCreate: { examId: string; questionId: string; order: number }[] = [];
  for (const qId of questionIds) {
    if (!existingSet.has(qId)) {
      toCreate.push({ examId, questionId: qId, order });
      order++;
    }
  }

  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0, message: "Semua soal sudah terpasang di ujian ini" });
  }

  const result = await db.examQuestion.createMany({ data: toCreate });
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
  return NextResponse.json({ success: true });
}
