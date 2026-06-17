import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      questions: { orderBy: { createdAt: "asc" } },
      _count: { select: { attempts: true } },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(exam);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const exam = await db.exam.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.duration !== undefined && { duration: Number(body.duration) }),
      ...(body.startTime !== undefined && { startTime: body.startTime ? new Date(body.startTime) : null }),
      ...(body.endTime !== undefined && { endTime: body.endTime ? new Date(body.endTime) : null }),
      ...(body.isRandomized !== undefined && { isRandomized: Boolean(body.isRandomized) }),
      ...(body.passingScore !== undefined && { passingScore: Number(body.passingScore) }),
      ...(body.isPublished !== undefined && { isPublished: Boolean(body.isPublished) }),
    },
  });

  return NextResponse.json(exam);
}
