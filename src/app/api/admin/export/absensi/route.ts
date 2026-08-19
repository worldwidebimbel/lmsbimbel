import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK", "GURU"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = {};
  const attWhere: Record<string, unknown> = {};
  if (classId) attWhere.classId = classId;
  if (branchId && !classId) attWhere.class = { branchId };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    attWhere.date = dateFilter;
  }
  if (Object.keys(attWhere).length > 0) where.attendance = attWhere;

  const records = await db.attendanceRecord.findMany({
    where,
    include: {
      student: { select: { name: true } },
      attendance: {
        select: {
          date: true,
          class: { select: { name: true, subject: { select: { name: true } } } },
        },
      },
    },
    orderBy: { attendance: { date: "desc" } },
    take: 5000,
  });

  const data = records.map((r) => ({
    tanggal: r.attendance.date.toISOString().split("T")[0],
    siswa: r.student.name,
    kelas: r.attendance.class.name,
    mapel: r.attendance.class.subject.name,
    status: r.status,
    catatan: r.note ?? "",
  }));

  const buffer = await generateExcelBuffer({
    filename: "absensi",
    sheetName: "Absensi",
    columns: [
      { header: "Tanggal", key: "tanggal", width: 12 },
      { header: "Siswa", key: "siswa", width: 25 },
      { header: "Kelas", key: "kelas", width: 15 },
      { header: "Mapel", key: "mapel", width: 15 },
      { header: "Status", key: "status", width: 10 },
      { header: "Catatan", key: "catatan", width: 20 },
    ],
    data,
  });

  return excelResponse(buffer, "absensi");
}
