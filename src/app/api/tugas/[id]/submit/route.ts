import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content, fileUrl } = body;

  if (!content && !fileUrl) {
    return NextResponse.json({ error: "Isi jawaban atau upload file" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || !assignment.isPublished) {
    return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
  }

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: id, studentId: session.user.id } },
    create: {
      assignmentId: id,
      studentId: session.user.id,
      content,
      fileUrl,
    },
    update: {
      content,
      fileUrl,
      submittedAt: new Date(),
      score: null,
      feedback: null,
      gradedAt: null,
    },
  });

  return NextResponse.json(submission);
}
