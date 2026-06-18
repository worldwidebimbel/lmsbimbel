import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;

  if (session.user.role === "SISWA") {
    const enrolled = await db.classStudent.findMany({
      where: { studentId: session.user.id },
      select: { classId: true },
    });
    const allowedClassIds = enrolled.map((e) => e.classId);
    if (classId && !allowedClassIds.includes(classId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!classId && !subjectId) {
      where.classId = { in: allowedClassIds };
    }
  }

  const threads = await db.forumThread.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, avatar: true, role: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, color: true } },
      _count: { select: { replies: true, upvotes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(threads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { classId, subjectId, title, content } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
  }

  const thread = await db.forumThread.create({
    data: {
      classId: classId ?? null,
      subjectId: subjectId ?? null,
      authorId: session.user.id,
      title: title.trim(),
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, avatar: true, role: true } },
      _count: { select: { replies: true, upvotes: true } },
    },
  });

  return NextResponse.json(thread, { status: 201 });
}
