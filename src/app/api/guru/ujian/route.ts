import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exams = await db.exam.findMany({
    where: { class: { teacherId: session.user.id } },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, classId, duration, startTime, endTime, isRandomized, passingScore } = body;

  if (!title || !classId || !duration) {
    return NextResponse.json({ error: "title, classId, duration wajib diisi" }, { status: 400 });
  }

  const exam = await db.exam.create({
    data: {
      title,
      description: description ?? null,
      classId,
      duration: Number(duration),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isRandomized: Boolean(isRandomized),
      passingScore: Number(passingScore ?? 60),
    },
  });

  return NextResponse.json(exam, { status: 201 });
}
