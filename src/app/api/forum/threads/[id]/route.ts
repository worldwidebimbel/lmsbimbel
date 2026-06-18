import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
  return NextResponse.json(thread);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const thread = await db.forumThread.findUnique({ where: { id }, select: { authorId: true } });

  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isOwner = thread.authorId === session.user.id;
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "GURU"].includes(session.user.role);
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.forumThread.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
