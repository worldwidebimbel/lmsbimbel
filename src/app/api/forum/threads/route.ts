import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, getAllowedClassIds } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  const where: Record<string, unknown> = {};
  if (subjectId) where.subjectId = subjectId;

  if (classId) {
    if (!allowedClassIds.includes(classId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.classId = classId;
  } else {
    where.classId = { in: allowedClassIds };
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

  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  const body = await req.json();
  const { classId, subjectId, title, content } = body;

  if (!classId || !allowedClassIds.includes(classId)) {
    return NextResponse.json({ error: "Kelas tidak valid atau tidak diizinkan" }, { status: 403 });
  }
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
  }

  const thread = await db.forumThread.create({
    data: {
      classId,
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

  await logAudit({ entity: "ForumThread", entityId: thread.id, action: "CREATE", after: { classId, subjectId: subjectId ?? null, title: title.trim() } });

  return NextResponse.json(thread, { status: 201 });
}
