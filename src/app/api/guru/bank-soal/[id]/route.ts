import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const question = await db.question.findUnique({ where: { id } });

  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (question.examId !== null) {
    return NextResponse.json({ error: "Hanya soal bank (tanpa ujian) yang bisa dihapus dari sini" }, { status: 400 });
  }

  await db.question.delete({ where: { id } });
  await logAudit({ entity: "Question", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
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

  await logAudit({ entity: "Question", entityId: id, action: "UPDATE" });
  return NextResponse.json(updated);
}
