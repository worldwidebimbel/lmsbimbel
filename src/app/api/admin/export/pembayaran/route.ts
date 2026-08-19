import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { generateExcelBuffer, excelResponse } from "@/lib/export-excel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;

  const invoices = await db.invoice.findMany({
    where,
    include: {
      student: { select: { name: true, email: true } },
      branch: { select: { name: true } },
      program: { select: { name: true } },
      payments: { select: { amount: true, confirmedAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const data = invoices.map((inv) => {
    const paidAmount = inv.payments
      .filter((p) => p.confirmedAt)
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      id: inv.id.slice(-8).toUpperCase(),
      siswa: inv.student.name,
      email: inv.student.email ?? "",
      cabang: inv.branch?.name ?? "",
      program: inv.program?.name ?? "",
      jumlah: inv.amount,
      terbayar: paidAmount,
      sisa: inv.amount - paidAmount,
      status: inv.status,
      jatuhTempo: inv.dueDate.toISOString().split("T")[0],
      dibuat: inv.createdAt.toISOString().split("T")[0],
    };
  });

  const buffer = await generateExcelBuffer({
    filename: "pembayaran",
    sheetName: "Pembayaran",
    columns: [
      { header: "ID", key: "id", width: 12 },
      { header: "Siswa", key: "siswa", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Cabang", key: "cabang", width: 15 },
      { header: "Program", key: "program", width: 18 },
      { header: "Jumlah", key: "jumlah", width: 12, format: "#,##0" },
      { header: "Terbayar", key: "terbayar", width: 12, format: "#,##0" },
      { header: "Sisa", key: "sisa", width: 12, format: "#,##0" },
      { header: "Status", key: "status", width: 12 },
      { header: "Jatuh Tempo", key: "jatuhTempo", width: 12 },
      { header: "Dibuat", key: "dibuat", width: 12 },
    ],
    data,
  });

  return excelResponse(buffer, "pembayaran");
}
