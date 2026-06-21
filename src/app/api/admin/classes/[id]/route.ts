import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();

  const cls = await db.class.findUnique({
    where: { id },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, code: true } },
      students: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { student: { name: "asc" } },
      },
      schedules: true,
      _count: { select: { students: true, materials: true, assignments: true } },
    },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && cls.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(cls);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();

  const existing = await db.class.findUnique({ where: { id }, select: { branchId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && existing.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      ...(isSuperAdmin && body.branchId !== undefined && { branchId: body.branchId || null }),
    },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, code: true } },
    },
  });

  return NextResponse.json(updated);
}
