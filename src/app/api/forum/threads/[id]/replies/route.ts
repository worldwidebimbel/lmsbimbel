import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, getAllowedClassIds } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: threadId } = await params;
  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) return NextResponse.json({ error: "content wajib diisi" }, { status: 400 });

  const thread = await db.forumThread.findUnique({
    where: { id: threadId },
    select: { isLocked: true, classId: true },
  });
  if (!thread) return NextResponse.json({ error: "Thread tidak ditemukan" }, { status: 404 });
  if (thread.classId && !allowedClassIds.includes(thread.classId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (thread.isLocked) return NextResponse.json({ error: "Thread sudah dikunci" }, { status: 400 });

  const reply = await db.forumReply.create({
    data: { threadId, authorId: session.user.id, content: content.trim() },
    include: {
      author: { select: { id: true, name: true, avatar: true, role: true } },
      _count: { select: { upvotes: true } },
    },
  });

  await db.forumThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  await logAudit({ entity: "ForumReply", entityId: reply.id, action: "CREATE", after: { threadId, content: content.trim() } });

  return NextResponse.json(reply, { status: 201 });
}
