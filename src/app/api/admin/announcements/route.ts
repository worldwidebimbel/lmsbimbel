import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { emailAnnouncementBroadcast } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();

  const announcements = await db.notification.findMany({
    where: {
      type: "INFO",
      ...(branchId && !isSuperAdmin ? { user: { defaultBranchId: branchId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    distinct: ["content"],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { title, content, type, link, targetRole, branchId: bodyBranchId } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
  }

  const targetBranchId = isSuperAdmin ? (bodyBranchId || branchId) : branchId;
  if (!isSuperAdmin && bodyBranchId && bodyBranchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    where: {
      isActive: true,
      ...(targetRole ? { role: targetRole } : {}),
      ...(targetBranchId ? { defaultBranchId: targetBranchId } : {}),
    },
    select: { id: true, email: true },
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

  const sendEmail = body.sendEmail ?? false;
  if (sendEmail && users.length > 0) {
    const emails = users.map((u) => u.email).filter(Boolean) as string[];
    emailAnnouncementBroadcast({ to: emails, title, message: content }).catch((e) =>
      console.error("[email] Broadcast failed:", e)
    );
  }

  return NextResponse.json({ sent: users.length }, { status: 201 });
}
