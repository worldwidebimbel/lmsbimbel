import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, getAllowedClassIds } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  await db.forumThread.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const thread = await db.forumThread.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, avatar: true, role: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, color: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, avatar: true, role: true } },
          _count: { select: { upvotes: true } },
        },
        orderBy: [{ isAnswer: "desc" }, { createdAt: "asc" }],
      },
      _count: { select: { upvotes: true } },
    },
  });

  if (!thread) return NextResponse.json({ error: "Thread tidak ditemukan" }, { status: 404 });
  if (thread.classId && !allowedClassIds.includes(thread.classId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(thread);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  const thread = await db.forumThread.findUnique({
    where: { id },
    select: { authorId: true, classId: true },
  });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (thread.classId && !allowedClassIds.includes(thread.classId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const isOwner = thread.authorId === session.user.id;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "GURU"].includes(session.user.role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.forumThread.delete({ where: { id } });
  await logAudit({ entity: "ForumThread", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
