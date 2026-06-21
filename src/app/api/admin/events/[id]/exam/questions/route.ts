import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

async function resolveExam(eventId: string, branchId: string | null, isSuperAdmin: boolean) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (!isSuperAdmin && branchId && event.branchId !== branchId) return null;
  const exam = await db.exam.findFirst({ where: { eventId } });
  return exam;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(id, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const { type, content, options, correctAnswer, explanation, score, difficulty } = body;

  if (!content) return NextResponse.json({ error: "Konten soal wajib diisi" }, { status: 400 });

  const question = await db.question.create({
    data: {
      examId: exam.id,
      type: type ?? "PILGAN",
      content,
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
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const exam = await resolveExam(id, branchId, isSuperAdmin);
  if (!exam) return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });

  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId wajib" }, { status: 400 });

  await db.question.delete({ where: { id: questionId, examId: exam.id } });
  return NextResponse.json({ success: true });
}
