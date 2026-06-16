import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, subId } = await params;
  const body = await req.json();
  const { score, feedback } = body;

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  if (score !== undefined && (score < 0 || score > assignment.maxScore)) {
    return NextResponse.json(
      { error: `Nilai harus antara 0 dan ${assignment.maxScore}` },
      { status: 400 }
    );
  }

  const updated = await prisma.submission.update({
    where: { id: subId },
    data: {
      ...(score !== undefined && { score }),
      ...(feedback !== undefined && { feedback }),
      gradedAt: new Date(),
    },
    include: {
      student: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(updated);
}
