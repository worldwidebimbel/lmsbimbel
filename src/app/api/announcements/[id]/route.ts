import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    title, content, targetRoles, targetBranchIds, targetProgramIds,
    targetClassIds, imageUrl, attachmentUrl, startDate, expiresAt, isPinned,
  } = body;

  const announcement = await db.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(targetRoles !== undefined && { targetRoles }),
      ...(targetBranchIds !== undefined && { targetBranchIds }),
      ...(targetProgramIds !== undefined && { targetProgramIds }),
      ...(targetClassIds !== undefined && { targetClassIds }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl ?? null }),
      ...(attachmentUrl !== undefined && { attachmentUrl: attachmentUrl ?? null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(isPinned !== undefined && { isPinned }),
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "Announcement",
    entityId: id,
    after: { title },
  });

  return NextResponse.json(announcement);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.announcement.delete({ where: { id } });

  await logAudit({
    action: "DELETE",
    entity: "Announcement",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
