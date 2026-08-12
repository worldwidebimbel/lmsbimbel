import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const cls = await db.class.findUnique({ where: { id }, select: { maxStudents: true, _count: { select: { students: true } } } });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cls._count.students >= cls.maxStudents) {
    return NextResponse.json({ error: "Kelas sudah penuh" }, { status: 409 });
  }

  const record = await db.classStudent.upsert({
    where: { classId_studentId: { classId: id, studentId } },
    create: { classId: id, studentId },
    update: {},
    include: { student: { select: { id: true, name: true, email: true } } },
  });

  await logAudit({
    entity: "ClassStudent",
    entityId: `${id}_${studentId}`,
    action: "ENROLL",
    after: { classId: id, studentId },
  });

  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  await db.classStudent.delete({ where: { classId_studentId: { classId: id, studentId } } });

  await logAudit({
    entity: "ClassStudent",
    entityId: `${id}_${studentId}`,
    action: "UNENROLL",
    before: { classId: id, studentId },
  });

  return NextResponse.json({ success: true });
}
