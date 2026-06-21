import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Hanya siswa yang bisa scan absensi" }, { status: 403 });
  }

  const { token } = await params;
  const { branchId } = await getBranchScope();

  const attendance = await db.attendance.findUnique({
    where: { id: token },
    include: {
      class: {
        include: {
          students: { where: { studentId: session.user.id }, select: { studentId: true } },
        },
      },
    },
  });

  if (!attendance) {
    return NextResponse.json({ error: "Sesi absensi tidak ditemukan" }, { status: 404 });
  }

  if (branchId && attendance.class.branchId !== branchId) {
    return NextResponse.json({ error: "Kamu tidak terdaftar di cabang kelas ini" }, { status: 403 });
  }

  if (attendance.class.students.length === 0) {
    return NextResponse.json({ error: "Kamu tidak terdaftar di kelas ini" }, { status: 403 });
  }

  const sessionDate = new Date(attendance.date);
  const now = new Date();
  const diffHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
  if (diffHours > 24) {
    return NextResponse.json({ error: "Sesi absensi sudah kedaluwarsa (lebih dari 24 jam)" }, { status: 410 });
  }

  const existing = await db.attendanceRecord.findFirst({
    where: { attendanceId: token, studentId: session.user.id },
  });

  if (existing) {
    return NextResponse.json({
      success: true,
      alreadyMarked: true,
      status: existing.status,
      message: `Kamu sudah tercatat: ${existing.status}`,
    });
  }

  const record = await db.attendanceRecord.create({
    data: {
      attendanceId: token,
      studentId: session.user.id,
      status: "HADIR",
    },
  });

  return NextResponse.json({
    success: true,
    alreadyMarked: false,
    status: record.status,
    message: "Kehadiran berhasil dicatat!",
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const { branchId } = await getBranchScope();

  const attendance = await db.attendance.findUnique({
    where: { id: token },
    include: { class: { select: { id: true, name: true, branchId: true } } },
  });

  if (!attendance) {
    return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
  }

  if (branchId && attendance.class.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: attendance.id,
    className: attendance.class.name,
    date: attendance.date,
    classId: attendance.classId,
  });
}
