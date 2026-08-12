import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { type, content, imageUrl, audioUrl, videoUrl, options, correctAnswer, explanation, score, difficulty } = body;

  if (!content) return NextResponse.json({ error: "content wajib diisi" }, { status: 400 });

  const question = await db.question.create({
    data: {
      examId: id,
      type: type ?? "PILGAN",
      content,
      imageUrl: imageUrl ?? null,
      audioUrl: audioUrl ?? null,
      videoUrl: videoUrl ?? null,
      options: options ?? null,
      correctAnswer: correctAnswer ?? null,
      explanation: explanation ?? null,
      score: Number(score ?? 1),
      difficulty: Number(difficulty ?? 2),
    },
  });

  return NextResponse.json(question, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { questionId } = body;

  if (!questionId) return NextResponse.json({ error: "questionId wajib" }, { status: 400 });

  await db.question.delete({ where: { id: questionId } });
  return NextResponse.json({ success: true });
}
