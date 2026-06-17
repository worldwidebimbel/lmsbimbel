import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const announcements = await db.notification.findMany({
    where: { type: "INFO" },
    orderBy: { createdAt: "desc" },
    take: 30,
    distinct: ["content"],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, type, link, targetRole } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
  }

  const users = await db.user.findMany({
    where: {
      isActive: true,
      ...(targetRole ? { role: targetRole } : {}),
    },
    select: { id: true },
  });

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title,
      content,
      type: type ?? "INFO",
      link: link ?? null,
    })),
  });

  return NextResponse.json({ sent: users.length }, { status: 201 });
}
