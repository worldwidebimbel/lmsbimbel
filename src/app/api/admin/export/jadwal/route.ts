import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();

  const where: Record<string, unknown> = {};
  if (branchId) where.class = { branchId };

  const schedules = await db.schedule.findMany({
    where,
    include: {
      class: { select: { name: true, subject: { select: { name: true } } } },
      teacher: { select: { name: true } },
      roomRel: { select: { name: true, building: { select: { name: true } } } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    take: 5000,
  });

  const dayMap: Record<string, string> = {
    MINGGU: "Minggu", SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu", KAMIS: "Kamis", JUMAT: "Jumat", SABTU: "Sabtu",
  };

  const data = schedules.map((s) => ({
    hari: dayMap[s.dayOfWeek] ?? String(s.dayOfWeek),
    mulai: s.startTime,
    selesai: s.endTime,
    kelas: s.class.name,
    mapel: s.class.subject.name,
    tutor: s.teacher?.name ?? "",
    ruangan: s.roomRel?.name ?? "",
    gedung: s.roomRel?.building.name ?? "",
  }));

  const buffer = await generateExcelBuffer({
    filename: "jadwal",
    sheetName: "Jadwal",
    columns: [
      { header: "Hari", key: "hari", width: 10 },
      { header: "Mulai", key: "mulai", width: 10 },
      { header: "Selesai", key: "selesai", width: 10 },
      { header: "Kelas", key: "kelas", width: 15 },
      { header: "Mapel", key: "mapel", width: 15 },
      { header: "Tutor", key: "tutor", width: 20 },
      { header: "Ruangan", key: "ruangan", width: 12 },
      { header: "Gedung", key: "gedung", width: 15 },
    ],
    data,
  });

  return excelResponse(buffer, "jadwal");
}
