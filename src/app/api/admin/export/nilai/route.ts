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

  const where: Record<string, unknown> = {};
  if (classId) where.component = { classId };
  if (branchId && !classId) {
    where.component = { class: { branchId } };
  }

  const grades = await db.grade.findMany({
    where,
    include: {
      student: { select: { name: true } },
      component: { select: { name: true, weight: true, class: { select: { name: true, subject: { select: { name: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const data = grades.map((g) => ({
    siswa: g.student.name,
    kelas: g.component.class.name,
    mapel: g.component.class.subject.name,
    komponen: g.component.name,
    bobot: g.component.weight,
    nilai: g.score,
    tanggal: g.createdAt.toISOString().split("T")[0],
  }));

  const buffer = await generateExcelBuffer({
    filename: "nilai",
    sheetName: "Nilai",
    columns: [
      { header: "Siswa", key: "siswa", width: 25 },
      { header: "Kelas", key: "kelas", width: 15 },
      { header: "Mapel", key: "mapel", width: 15 },
      { header: "Komponen", key: "komponen", width: 20 },
      { header: "Bobot (%)", key: "bobot", width: 10 },
      { header: "Nilai", key: "nilai", width: 8 },
      { header: "Tanggal", key: "tanggal", width: 12 },
    ],
    data,
  });

  return excelResponse(buffer, "nilai");
}
