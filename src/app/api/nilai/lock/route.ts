import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden: hanya admin yang dapat mengunci nilai" }, { status: 403 });
  }

  const { studentId, componentId, lock } = await req.json();
  if (!studentId || !componentId || typeof lock !== "boolean") {
    return NextResponse.json({ error: "studentId, componentId, dan lock wajib diisi" }, { status: 400 });
  }

  const grade = await db.grade.findUnique({
    where: { studentId_componentId: { studentId, componentId } },
  });
  if (!grade) {
    return NextResponse.json({ error: "Nilai tidak ditemukan" }, { status: 404 });
  }

  const updated = await db.grade.update({
    where: { studentId_componentId: { studentId, componentId } },
    data: lock
      ? { isLocked: true, lockedBy: session.user.id, lockedAt: new Date() }
      : { isLocked: false, lockedBy: null, lockedAt: null },
  });

  await logAudit({
    entity: "Grade",
    entityId: `${studentId}_${componentId}`,
    action: lock ? "LOCK" : "UNLOCK",
    after: { isLocked: lock, lockedBy: lock ? session.user.id : null },
  });

  return NextResponse.json({ success: true, isLocked: updated.isLocked });
}
