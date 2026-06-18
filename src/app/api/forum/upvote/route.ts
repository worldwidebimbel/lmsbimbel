import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { threadId, replyId } = body;

  if (!threadId && !replyId) {
    return NextResponse.json({ error: "threadId atau replyId wajib diisi" }, { status: 400 });
  }

  const userId = session.user.id;

  if (threadId) {
    const existing = await db.forumUpvote.findUnique({ where: { userId_threadId: { userId, threadId } } });
    if (existing) {
      await db.forumUpvote.delete({ where: { userId_threadId: { userId, threadId } } });
      return NextResponse.json({ upvoted: false });
    }
    await db.forumUpvote.create({ data: { userId, threadId } });
    return NextResponse.json({ upvoted: true });
  }

  if (replyId) {
    const existing = await db.forumUpvote.findUnique({ where: { userId_replyId: { userId, replyId } } });
    if (existing) {
      await db.forumUpvote.delete({ where: { userId_replyId: { userId, replyId } } });
      return NextResponse.json({ upvoted: false });
    }
    await db.forumUpvote.create({ data: { userId, replyId } });
    return NextResponse.json({ upvoted: true });
  }
}
