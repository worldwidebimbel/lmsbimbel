import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, subjectId, teacherId, type, maxStudents, room, startDate, endDate } = body;

  if (!name || !subjectId || !teacherId) {
    return NextResponse.json({ error: "name, subjectId, teacherId wajib diisi" }, { status: 400 });
  }

  const cls = await db.class.create({
    data: {
      name,
      description,
      subjectId,
      teacherId,
      type: type ?? "REGULER",
      maxStudents: maxStudents ?? 30,
      room,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true, color: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(cls, { status: 201 });
}
