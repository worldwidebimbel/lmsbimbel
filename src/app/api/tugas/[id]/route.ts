import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      submissions: {
        include: {
          student: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assignment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
      ...(body.maxScore !== undefined && { maxScore: body.maxScore }),
      ...(body.fileUrl !== undefined && { fileUrl: body.fileUrl }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    },
    include: { class: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  await prisma.submission.deleteMany({ where: { assignmentId: id } });
  await prisma.assignment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
