import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await db.liveSession.findUnique({ where: { id }, select: { teacherId: true } });
  if (!existing || existing.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.liveSession.update({
    where: { id },
    data: {
      title: body.title?.trim(),
      description: body.description?.trim() ?? null,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : null,
      meetingUrl: body.meetingUrl?.trim() ?? null,
      platform: body.platform,
      recordingUrl: body.recordingUrl?.trim() ?? null,
      isActive: body.isActive,
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  await logAudit({ entity: "LiveSession", entityId: id, action: "UPDATE", after: { title: body.title, isActive: body.isActive } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.liveSession.findUnique({ where: { id }, select: { teacherId: true } });
  if (!existing || existing.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.liveSession.delete({ where: { id } });
  await logAudit({ entity: "LiveSession", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
