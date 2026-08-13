import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { CalendarEventType } from "@prisma/client";

const validTypes = Object.values(CalendarEventType);

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await db.academicCalendar.findMany({
    orderBy: { startDate: "asc" },
    include: { branch: { select: { name: true } }, creator: { select: { name: true } } },
  });
  return NextResponse.json({ events: JSON.parse(JSON.stringify(events)) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, type, startDate, endDate, isAllDay, color, branchId, isActive } = body;

  if (!title || !startDate) {
    return NextResponse.json({ error: "Judul dan tanggal mulai wajib diisi" }, { status: 400 });
  }
  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipe event tidak valid" }, { status: 400 });
  }

  const event = await db.academicCalendar.create({
    data: {
      title,
      description,
      type: type ?? CalendarEventType.LAINNYA,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isAllDay: isAllDay ?? true,
      color,
      branchId: branchId || null,
      isActive: isActive ?? true,
      createdBy: session.user.id,
    },
  });
  return NextResponse.json({ event: JSON.parse(JSON.stringify(event)) });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, title, description, type, startDate, endDate, isAllDay, color, branchId, isActive } = body;
  if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipe event tidak valid" }, { status: 400 });
  }

  const event = await db.academicCalendar.update({
    where: { id },
    data: {
      title,
      description,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate === null ? null : endDate ? new Date(endDate) : undefined,
      isAllDay,
      color,
      branchId: branchId === null ? null : branchId || undefined,
      isActive,
    },
  });
  return NextResponse.json({ event: JSON.parse(JSON.stringify(event)) });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

  await db.academicCalendar.delete({ where: { id: body.id } });
  return NextResponse.json({ success: true });
}
