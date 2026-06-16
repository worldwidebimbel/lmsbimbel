import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

interface RecordInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { records } = body as { records: RecordInput[] };

  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "records wajib diisi" }, { status: 400 });
  }

  const attendance = await db.attendance.findUnique({ where: { id } });
  if (!attendance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.attendanceRecord.deleteMany({ where: { attendanceId: id } });

  const created = await db.attendanceRecord.createMany({
    data: records.map((r) => ({
      attendanceId: id,
      studentId: r.studentId,
      status: r.status,
      note: r.note ?? null,
    })),
  });

  return NextResponse.json({ count: created.count });
}
