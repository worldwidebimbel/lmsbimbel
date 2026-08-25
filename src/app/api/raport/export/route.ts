import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const periodId = searchParams.get("periodId");

  const where: Record<string, unknown> = {};
  if (classId) where.classId = classId;
  if (periodId) where.periodId = periodId;

  const raports = await db.raport.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      reportPeriod: { select: { id: true, name: true } },
      details: true,
    },
    orderBy: { finalGrade: "desc" },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Nilai");

  ws.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Siswa", key: "name", width: 30 },
    { header: "Kelas", key: "className", width: 20 },
    { header: "Periode", key: "periodName", width: 25 },
    { header: "Nilai Akhir", key: "finalGrade", width: 12 },
    { header: "Predikat", key: "predicate", width: 10 },
    { header: "Hadir", key: "hadir", width: 8 },
    { header: "Sakit", key: "sakit", width: 8 },
    { header: "Izin", key: "izin", width: 8 },
    { header: "Alpha", key: "alpha", width: 8 },
    { header: "Status", key: "status", width: 12 },
  ];

  ws.getRow(1).font = { bold: true };

  raports.forEach((r, i) => {
    const att = (r.attendanceSummary as Record<string, number> | null) ?? {};
    ws.addRow({
      no: i + 1,
      name: r.student.name,
      className: r.class.name,
      periodName: r.reportPeriod?.name ?? r.semester,
      finalGrade: r.finalGrade ?? 0,
      predicate: r.predicate ?? "-",
      hadir: att.HADIR ?? 0,
      sakit: att.SAKIT ?? 0,
      izin: att.IZIN ?? 0,
      alpha: att.ALPHA ?? 0,
      status: r.status,
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rekap-rapor-${Date.now()}.xlsx"`,
    },
  });
}
