import { NextRequest } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
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

  const where: Record<string, unknown> = {};
  if (!isSuperAdmin && branchId) where.branchId = branchId;
  if (teacherId) where.teacherId = teacherId;

  const payrolls = await db.teacherPayroll.findMany({
    where,
    include: {
      teacher: { select: { name: true, email: true } },
      branch: { select: { name: true } },
    },
    orderBy: { periodStart: "desc" },
  });

  const data = payrolls.map((p) => ({
    tutor: p.teacher.name,
    email: p.teacher.email,
    cabang: p.branch?.name ?? "-",
    periodeMulai: new Date(p.periodStart).toLocaleDateString("id-ID"),
    periodeSelesai: new Date(p.periodEnd).toLocaleDateString("id-ID"),
    ratePertemuan: p.ratePerMeeting,
    rateJam: p.ratePerHour,
    totalPertemuan: p.totalMeetings,
    totalJam: p.totalHours,
    totalHonor: p.totalAmount,
    status: p.status,
    dibayarPada: p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "-",
  }));

  const buffer = await generateExcelBuffer({
    filename: "laporan-honor-tutor",
    sheetName: "Honor Tutor",
    columns: [
      { header: "Tutor", key: "tutor", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "Periode Mulai", key: "periodeMulai", width: 14 },
      { header: "Periode Selesai", key: "periodeSelesai", width: 14 },
      { header: "Rate/Pertemuan", key: "ratePertemuan", width: 15, format: "#,##0" },
      { header: "Rate/Jam", key: "rateJam", width: 12, format: "#,##0" },
      { header: "Total Pertemuan", key: "totalPertemuan", width: 12 },
      { header: "Total Jam", key: "totalJam", width: 10 },
      { header: "Total Honor", key: "totalHonor", width: 15, format: "#,##0" },
      { header: "Status", key: "status", width: 12 },
      { header: "Dibayar Pada", key: "dibayarPada", width: 14 },
    ],
    data,
    summaryRows: [
      {
        tutor: "TOTAL",
        totalHonor: data.reduce((s, d) => s + d.totalHonor, 0),
        totalPertemuan: data.reduce((s, d) => s + d.totalPertemuan, 0),
      },
    ],
  });

  return excelResponse(buffer, "laporan-honor-tutor");
}
