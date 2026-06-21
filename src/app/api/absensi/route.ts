import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const { isSuperAdmin, branchId } = await getBranchScope();

  const where: Record<string, unknown> = {};

  if (session.user.role === "GURU") {
    const classWhere = branchId
      ? { teacherId: session.user.id, branchId }
      : { teacherId: session.user.id };
    const classes = await db.class.findMany({
      where: classWhere,
      select: { id: true },
    });
    const ids = classes.map((c) => c.id);
    where.classId = classId ? classId : { in: ids };
  } else if (session.user.role === "SISWA") {
    const enrolled = await db.classStudent.findMany({
      where: { studentId: session.user.id },
      select: { classId: true },
    });
    where.classId = { in: enrolled.map((e) => e.classId) };
  }

  if (!isSuperAdmin && branchId) {
    where.class = { branchId };
  }

  const attendances = await db.attendance.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { records: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(attendances);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { classId, date } = body;

  if (!classId || !date) {
    return NextResponse.json({ error: "classId dan date wajib diisi" }, { status: 400 });
  }

  const cls = await db.class.findUnique({ where: { id: classId }, select: { branchId: true } });
  if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  if (!isSuperAdmin && branchId && cls.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  const existing = await db.attendance.findUnique({
    where: { classId_date: { classId, date: parsedDate } },
  });
  if (existing) {
    return NextResponse.json({ error: "Sesi absensi tanggal ini sudah ada" }, { status: 409 });
  }

  const attendance = await db.attendance.create({
    data: { classId, date: parsedDate },
    include: { class: { select: { id: true, name: true } } },
  });

  return NextResponse.json(attendance, { status: 201 });
}
