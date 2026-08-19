import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const question = await db.question.findUnique({ where: { id } });

  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (question.examId !== null) {
    return NextResponse.json({ error: "Hanya soal bank (tanpa ujian) yang bisa dihapus dari sini" }, { status: 400 });
  }

  await db.question.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { subjectId, type, content, options, correctAnswer, explanation, score, difficulty, tags } = body;

  const question = await db.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (question.examId !== null) {
    return NextResponse.json({ error: "Hanya soal bank yang bisa diedit dari sini" }, { status: 400 });
  }

  const updated = await db.question.update({
    where: { id },
    data: {
      ...(subjectId !== undefined && { subjectId: subjectId || null }),
      ...(type && { type }),
      ...(content && { content }),
      ...(options !== undefined && { options: options ?? null }),
      ...(correctAnswer !== undefined && { correctAnswer: correctAnswer ?? null }),
      ...(explanation !== undefined && { explanation: explanation ?? null }),
      ...(score !== undefined && { score }),
      ...(difficulty !== undefined && { difficulty }),
      ...(tags !== undefined && { tags: tags ?? null }),
    },
    include: { subject: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(updated);
}
