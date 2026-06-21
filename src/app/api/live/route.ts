import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, getAllowedClassIds } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const userId = session.user.id;
  const role = session.user.role;

  const { branchId, isSuperAdmin } = await getBranchScope();
  const allowedClassIds = await getAllowedClassIds(session.user, isSuperAdmin ? null : branchId);

  if (classId && !allowedClassIds.includes(classId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let where: Record<string, unknown> = {};

  if (role === "GURU") {
    where = classId ? { teacherId: userId, classId } : { teacherId: userId };
  } else if (role === "SISWA") {
    where = classId ? { classId } : { classId: { in: allowedClassIds } };
  } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
    where = classId ? { classId } : { classId: { in: allowedClassIds } };
  }

  const sessions = await db.liveSession.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { classId, title, description, startTime, endTime, meetingUrl, platform } = body;

  if (!classId || !title?.trim() || !startTime) {
    return NextResponse.json({ error: "classId, title, startTime wajib diisi" }, { status: 400 });
  }

  const cls = await db.class.findFirst({ where: { id: classId, teacherId: session.user.id } });
  if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });

  const liveSession = await db.liveSession.create({
    data: {
      classId,
      teacherId: session.user.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      meetingUrl: meetingUrl?.trim() ?? null,
      platform: platform ?? "Google Meet",
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(liveSession, { status: 201 });
}
