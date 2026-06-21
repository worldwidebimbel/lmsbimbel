import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, canChatWith } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");
  const userId = session.user.id;
  const { branchId, isSuperAdmin } = await getBranchScope();

  if (!withUserId) {
    // Get list of conversations (last message per contact)
    const [sent, received] = await Promise.all([
      db.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: "desc" },
        include: { receiver: { select: { id: true, name: true, avatar: true, role: true } } },
        distinct: ["receiverId"],
      }),
      db.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: "desc" },
        include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
        distinct: ["senderId"],
      }),
    ]);

    const contactMap = new Map<string, { user: { id: string; name: string; avatar: string | null; role: string }; lastMessage: string; lastAt: Date; unread: number }>();

    for (const m of sent) {
      const key = m.receiverId;
      const allowed = await canChatWith(session.user, m.receiverId, isSuperAdmin ? null : branchId);
      if (!allowed) continue;
      if (!contactMap.has(key)) {
        contactMap.set(key, { user: m.receiver, lastMessage: m.content, lastAt: m.createdAt, unread: 0 });
      }
    }
    for (const m of received) {
      const key = m.senderId;
      const allowed = await canChatWith(session.user, m.senderId, isSuperAdmin ? null : branchId);
      if (!allowed) continue;
      const existing = contactMap.get(key);
      const isNewer = !existing || m.createdAt > existing.lastAt;
      const unread = await db.message.count({ where: { senderId: key, receiverId: userId, isRead: false } });
      if (!existing) {
        contactMap.set(key, { user: m.sender, lastMessage: m.content, lastAt: m.createdAt, unread });
      } else if (isNewer) {
        contactMap.set(key, { ...existing, lastMessage: m.content, lastAt: m.createdAt, unread });
      } else {
        contactMap.set(key, { ...existing, unread });
      }
    }

    const conversations = Array.from(contactMap.values()).sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
    return NextResponse.json(conversations);
  }

  const allowed = await canChatWith(session.user, withUserId, isSuperAdmin ? null : branchId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Mark messages from withUserId as read
  await db.message.updateMany({ where: { senderId: withUserId, receiverId: userId, isRead: false }, data: { isRead: true } });

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: withUserId },
        { senderId: withUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { receiverId, content } = body;

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "receiverId dan content wajib diisi" }, { status: 400 });
  }

  const receiver = await db.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) return NextResponse.json({ error: "Penerima tidak ditemukan" }, { status: 404 });

  const allowed = await canChatWith(session.user, receiverId, isSuperAdmin ? null : branchId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const msg = await db.message.create({
    data: { senderId: session.user.id, receiverId, content: content.trim() },
  });

  return NextResponse.json(msg, { status: 201 });
}
