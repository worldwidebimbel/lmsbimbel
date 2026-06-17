import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const schedules = await db.schedule.findMany({
    where: { classId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, room } = body;

  if (!dayOfWeek || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, endTime wajib" }, { status: 400 });
  }

  const schedule = await db.schedule.create({
    data: { classId: id, dayOfWeek, startTime, endTime, room: room ?? null },
  });
  return NextResponse.json(schedule, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { scheduleId } = body;
  if (!scheduleId) return NextResponse.json({ error: "scheduleId wajib" }, { status: 400 });
  await db.schedule.delete({ where: { id: scheduleId } });
  return NextResponse.json({ success: true });
}
