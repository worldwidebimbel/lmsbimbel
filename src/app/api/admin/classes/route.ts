import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, subjectId, teacherId, branchId, type, maxStudents, roomId, startDate, endDate } = body;

  if (!name || !subjectId || !teacherId) {
    return NextResponse.json({ error: "name, subjectId, teacherId wajib diisi" }, { status: 400 });
  }

  // Admin non-super must use their own branch
  const assignedBranchId = session.user.role === "SUPER_ADMIN"
    ? (branchId || session.user.defaultBranchId)
    : session.user.defaultBranchId;

  const cls = await db.class.create({
    data: {
      name,
      description,
      subjectId,
      teacherId,
      branchId: assignedBranchId,
      type: type ?? "REGULER",
      maxStudents: maxStudents ?? 30,
      roomId: roomId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  await logAudit({
    entity: "Class",
    entityId: cls.id,
    action: "CREATE",
    after: { name, subjectId, teacherId, branchId: assignedBranchId },
  });

  return NextResponse.json(cls, { status: 201 });
}
