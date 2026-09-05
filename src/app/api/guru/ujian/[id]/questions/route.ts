import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { type, content, imageUrl, audioUrl, videoUrl, options, correctAnswer, explanation, score, difficulty, sectionId, groupId } = body;

  if (!content) return NextResponse.json({ error: "content wajib diisi" }, { status: 400 });

  let section = null;
  if (sectionId) {
    section = await db.examSection.findUnique({ where: { id: sectionId } });
    if (!section || section.examId !== id) {
      return NextResponse.json({ error: "Section tidak valid untuk ujian ini" }, { status: 400 });
    }
  }

  let group = null;
  if (groupId) {
    group = await db.questionGroup.findUnique({ where: { id: groupId } });
    if (!group || group.examId !== id) {
      return NextResponse.json({ error: "Group tidak valid untuk ujian ini" }, { status: 400 });
    }
  }

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
      sectionId: section?.id ?? null,
      groupId: group?.id ?? null,
    },
  });

  await logAudit({ entity: "Question", entityId: question.id, action: "CREATE", after: { examId: id, type, sectionId: section?.id ?? null, groupId: group?.id ?? null } });
  return NextResponse.json(question, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { questionId, sectionId, groupId } = body as { questionId: string; sectionId?: string | null; groupId?: string | null };

  if (!questionId) return NextResponse.json({ error: "questionId wajib" }, { status: 400 });

  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question || question.examId !== id) {
    return NextResponse.json({ error: "Soal tidak ditemukan pada ujian ini" }, { status: 404 });
  }

  if (sectionId) {
    const section = await db.examSection.findUnique({ where: { id: sectionId } });
    if (!section || section.examId !== id) {
      return NextResponse.json({ error: "Section tidak valid untuk ujian ini" }, { status: 400 });
    }
  }

  if (groupId) {
    const group = await db.questionGroup.findUnique({ where: { id: groupId } });
    if (!group || group.examId !== id) {
      return NextResponse.json({ error: "Group tidak valid untuk ujian ini" }, { status: 400 });
    }
  }

  const data: { sectionId?: string | null; groupId?: string | null } = {};
  if (sectionId !== undefined) data.sectionId = sectionId || null;
  if (groupId !== undefined) data.groupId = groupId || null;

  const updated = await db.question.update({ where: { id: questionId }, data });

  await logAudit({ entity: "Question", entityId: questionId, action: "UPDATE", after: { examId: id, ...data } });
  return NextResponse.json(updated);
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
  await logAudit({ entity: "Question", entityId: questionId, action: "DELETE" });
  return NextResponse.json({ success: true });
}
