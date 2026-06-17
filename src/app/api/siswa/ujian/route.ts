import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrolledClasses = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    select: { classId: true },
  });
  const classIds = enrolledClasses.map((c) => c.classId);

  const exams = await db.exam.findMany({
    where: { classId: { in: classIds }, isPublished: true },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: session.user.id }, select: { id: true, score: true, isCompleted: true, submittedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}
