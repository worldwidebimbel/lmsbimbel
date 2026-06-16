import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const attendance = await db.attendance.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          students: {
            include: { student: { select: { id: true, name: true, avatar: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
      records: {
        include: { student: { select: { id: true, name: true } } },
      },
    },
  });

  if (!attendance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(attendance);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.attendanceRecord.deleteMany({ where: { attendanceId: id } });
  await db.attendance.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
