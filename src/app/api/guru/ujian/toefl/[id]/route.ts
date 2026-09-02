import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { kind, name, duration, order, title, passageText, audioUrl, maxPlayCount, timeLimit } = body;

  if (kind === "SECTION") {
    const section = await db.examSection.findUnique({ where: { id } });
    if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.examSection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });
    await logAudit({ entity: "ExamSection", entityId: id, action: "UPDATE" });
    return NextResponse.json(updated);
  }

  if (kind === "GROUP") {
    const group = await db.questionGroup.findUnique({ where: { id } });
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.questionGroup.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title ?? null }),
        ...(passageText !== undefined && { passageText: passageText ?? null }),
        ...(audioUrl !== undefined && { audioUrl: audioUrl ?? null }),
        ...(maxPlayCount !== undefined && { maxPlayCount: maxPlayCount ?? null }),
        ...(timeLimit !== undefined && { timeLimit: timeLimit ?? null }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });
    await logAudit({ entity: "QuestionGroup", entityId: id, action: "UPDATE" });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "kind wajib" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");

  if (kind === "SECTION") {
    await db.examSection.delete({ where: { id } });
    await logAudit({ entity: "ExamSection", entityId: id, action: "DELETE" });
    return NextResponse.json({ success: true });
  }

  if (kind === "GROUP") {
    await db.questionGroup.delete({ where: { id } });
    await logAudit({ entity: "QuestionGroup", entityId: id, action: "DELETE" });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "kind wajib" }, { status: 400 });
}
