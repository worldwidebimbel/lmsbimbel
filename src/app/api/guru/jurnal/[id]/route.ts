import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const journal = await db.teachingJournal.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      teacher: { select: { id: true, name: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
    },
  });

  if (!journal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "GURU" && journal.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(journal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const journal = await db.teachingJournal.findUnique({ where: { id } });

  if (!journal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "GURU" && journal.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { sessionDate, startTime, endTime, material, activity, obstacles, solution, studentCount, status } = body;

  const updated = await db.teachingJournal.update({
    where: { id },
    data: {
      ...(sessionDate && { sessionDate: new Date(sessionDate) }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(material !== undefined && { material: material ?? null }),
      ...(activity !== undefined && { activity }),
      ...(obstacles !== undefined && { obstacles: obstacles ?? null }),
      ...(solution !== undefined && { solution: solution ?? null }),
      ...(studentCount !== undefined && { studentCount }),
      ...(status && { status }),
    },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      teacher: { select: { id: true, name: true } },
    },
  });

  await logAudit({ entity: "TeachingJournal", entityId: id, action: "UPDATE" });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const journal = await db.teachingJournal.findUnique({ where: { id } });

  if (!journal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "GURU" && journal.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.teachingJournal.delete({ where: { id } });
  await logAudit({ entity: "TeachingJournal", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
