import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const classId = searchParams.get("classId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (!isSuperAdmin && branchId) where.branchId = branchId;
  if (teacherId) where.teacherId = teacherId;
  if (classId) where.classId = classId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.sessionDate = {};
    if (startDate) (where.sessionDate as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.sessionDate as Record<string, unknown>).lte = new Date(endDate);
  }

  const journals = await db.teachingJournal.findMany({
    where,
    include: {
      class: { select: { name: true, subject: { select: { name: true } } } },
      teacher: { select: { name: true } },
    },
    orderBy: { sessionDate: "desc" },
  });

  const data = journals.map((j) => ({
    tanggal: new Date(j.sessionDate).toLocaleDateString("id-ID"),
    kelas: j.class.name,
    mapel: j.class.subject.name,
    tutor: j.teacher.name,
    jam: `${j.startTime} - ${j.endTime}`,
    jumlahSiswa: j.studentCount,
    materi: j.material ?? "-",
    aktivitas: j.activity,
    kendala: j.obstacles ?? "-",
    solusi: j.solution ?? "-",
    status: j.status,
  }));

  const buffer = await generateExcelBuffer({
    filename: "jurnal-mengajar",
    sheetName: "Jurnal Mengajar",
    columns: [
      { header: "Tanggal", key: "tanggal", width: 12 },
      { header: "Kelas", key: "kelas", width: 20 },
      { header: "Mapel", key: "mapel", width: 18 },
      { header: "Tutor", key: "tutor", width: 22 },
      { header: "Jam", key: "jam", width: 15 },
      { header: "Jumlah Siswa", key: "jumlahSiswa", width: 12 },
      { header: "Materi", key: "materi", width: 30 },
      { header: "Aktivitas", key: "aktivitas", width: 40 },
      { header: "Kendala", key: "kendala", width: 25 },
      { header: "Solusi", key: "solusi", width: 25 },
      { header: "Status", key: "status", width: 12 },
    ],
    data,
    summaryRows: [
      {
        tutor: "TOTAL",
        jumlahSiswa: data.length,
      },
    ],
  });

  return excelResponse(buffer, `jurnal-mengajar-${Date.now()}`);
}
