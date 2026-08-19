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

  const existing = await db.examQuestion.findMany({
    where: { examId, questionId: { in: questionIds } },
    select: { questionId: true },
  });
  const existingIds = new Set(existing.map((e) => e.questionId));

  const maxOrder = await db.examQuestion.aggregate({
    where: { examId },
    _max: { order: true },
  });
  let nextOrder = (maxOrder._max.order ?? 0) + 1;

  const toCreate = bankQuestions
    .filter((q) => !existingIds.has(q.id))
    .map((q) => ({
      examId,
      questionId: q.id,
      order: nextOrder++,
      score: q.score,
    }));

  if (toCreate.length === 0) {
    return NextResponse.json({ imported: 0, message: "Semua soal sudah ada di ujian ini" });
  }

  const created = await db.examQuestion.createMany({ data: toCreate });

  return NextResponse.json({ imported: created.count }, { status: 201 });
}
