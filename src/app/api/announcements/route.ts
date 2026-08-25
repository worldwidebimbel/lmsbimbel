import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const branchId = searchParams.get("branchId");
  const programId = searchParams.get("programId");
  const classId = searchParams.get("classId");

  const now = new Date();
  const where: Record<string, unknown> = {
    expiresAt: { OR: [{ gt: now }, null] },
  };

  if (session.user.role === "SISWA" || session.user.role === "ORANG_TUA" || session.user.role === "GURU") {
    where.targetRoles = { has: session.user.role };
    if (session.user.defaultBranchId) {
      where.OR = [
        { targetBranchIds: { isEmpty: true } },
        { targetBranchIds: { has: session.user.defaultBranchId } },
      ];
    }
  } else if (!isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role) where.targetRoles = { has: role };
  if (branchId) where.targetBranchIds = { has: branchId };
  if (programId) where.targetProgramIds = { has: programId };
  if (classId) where.targetClassIds = { has: classId };

  const announcements = await db.announcement.findMany({
    where,
    include: { author: { select: { id: true, name: true } } },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title, content, targetRoles, targetBranchIds, targetProgramIds,
    targetClassIds, imageUrl, attachmentUrl, startDate, expiresAt, isPinned,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      title,
      content,
      authorId: session.user.id,
      targetRoles: targetRoles ?? [],
      targetBranchIds: targetBranchIds ?? [],
      targetProgramIds: targetProgramIds ?? [],
      targetClassIds: targetClassIds ?? [],
      imageUrl: imageUrl ?? null,
      attachmentUrl: attachmentUrl ?? null,
      startDate: startDate ? new Date(startDate) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isPinned: isPinned ?? false,
    },
  });

  if (targetRoles?.length > 0) {
    const users = await db.user.findMany({
      where: {
        isActive: true,
        role: { in: targetRoles },
        ...(targetBranchIds?.length > 0 ? { defaultBranchId: { in: targetBranchIds } } : {}),
      },
      select: { id: true },
    });

    if (users.length > 0) {
      await db.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title,
          content,
          type: "INFO" as const,
        })),
      });
    }
  }

  await logAudit({
    action: "CREATE",
    entity: "Announcement",
    entityId: announcement.id,
    after: { title, targetRoles },
  });

  return NextResponse.json(announcement, { status: 201 });
}
