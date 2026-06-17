import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const cls = await db.class.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
      students: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { student: { name: "asc" } },
      },
      schedules: true,
      _count: { select: { students: true, materials: true, assignments: true } },
    },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cls);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = await db.class.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.subjectId && { subjectId: body.subjectId }),
      ...(body.teacherId && { teacherId: body.teacherId }),
      ...(body.type && { type: body.type }),
      ...(body.maxStudents !== undefined && { maxStudents: body.maxStudents }),
      ...(body.room !== undefined && { room: body.room }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
