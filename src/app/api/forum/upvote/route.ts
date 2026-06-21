import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, getAllowedClassIds } from "@/lib/branch-context";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  const body = await req.json();
  const { threadId, replyId } = body;

  if (!threadId && !replyId) {
    return NextResponse.json({ error: "threadId atau replyId wajib diisi" }, { status: 400 });
  }

  const userId = session.user.id;

  if (threadId) {
    const thread = await db.forumThread.findUnique({ where: { id: threadId }, select: { classId: true } });
    if (!thread) return NextResponse.json({ error: "Thread tidak ditemukan" }, { status: 404 });
    if (thread.classId && !allowedClassIds.includes(thread.classId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const existing = await db.forumUpvote.findUnique({ where: { userId_threadId: { userId, threadId } } });
    if (existing) {
      await db.forumUpvote.delete({ where: { userId_threadId: { userId, threadId } } });
      return NextResponse.json({ upvoted: false });
    }
    await db.forumUpvote.create({ data: { userId, threadId } });
    return NextResponse.json({ upvoted: true });
  }

  if (replyId) {
    const reply = await db.forumReply.findUnique({
      where: { id: replyId },
      include: { thread: { select: { classId: true } } },
    });
    if (!reply) return NextResponse.json({ error: "Reply tidak ditemukan" }, { status: 404 });
    if (reply.thread.classId && !allowedClassIds.includes(reply.thread.classId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const existing = await db.forumUpvote.findUnique({ where: { userId_replyId: { userId, replyId } } });
    if (existing) {
      await db.forumUpvote.delete({ where: { userId_replyId: { userId, replyId } } });
      return NextResponse.json({ upvoted: false });
    }
    await db.forumUpvote.create({ data: { userId, replyId } });
    return NextResponse.json({ upvoted: true });
  }
}
