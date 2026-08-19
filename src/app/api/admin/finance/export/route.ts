import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const branch = searchParams.get("branch");
  const selectedBranch = branch && branch !== "all" ? branch : isSuperAdmin ? undefined : branchId ?? undefined;
  const branchFilter = selectedBranch ? { branchId: selectedBranch } : {};

  const [invoices, payments, transactions, commissions] = await Promise.all([
    db.invoice.findMany({
      where: branchFilter,
      include: { student: { select: { name: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({
      where: { confirmedAt: { not: null }, ...branchFilter },
      include: { invoice: { select: { student: { select: { name: true } } } }, user: { select: { name: true } } },
      orderBy: { confirmedAt: "desc" },
    }),
    db.branchTransaction.findMany({
      where: selectedBranch ? { branchId: selectedBranch } : {},
      orderBy: { date: "desc" },
    }),
    db.commission.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      include: { referral: { select: { affiliate: { select: { code: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "LMS Bimbel";
  wb.created = new Date();

  // Sheet 1: Invoice Summary
  const ws1 = wb.addWorksheet("Tagihan");
  ws1.columns = [
    { header: "Tanggal", key: "createdAt", width: 14 },
    { header: "Siswa", key: "studentName", width: 25 },
    { header: "Paket", key: "planName", width: 18 },
    { header: "Jumlah", key: "amount", width: 15 },
    { header: "Status", key: "status", width: 14 },
    { header: "Jatuh Tempo", key: "dueDate", width: 14 },
  ];
  for (const inv of invoices) {
    ws1.addRow({
      createdAt: format(new Date(inv.createdAt), "dd/MM/yyyy"),
      studentName: inv.student.name,
      planName: inv.plan?.name ?? "Manual",
      amount: inv.amount,
      status: inv.status,
      dueDate: format(new Date(inv.dueDate), "dd/MM/yyyy"),
    });
  }
  ws1.getRow(1).font = { bold: true };

  // Sheet 2: Payments
  const ws2 = wb.addWorksheet("Pembayaran");
  ws2.columns = [
    { header: "Tanggal Konfirmasi", key: "confirmedAt", width: 18 },
    { header: "Siswa", key: "studentName", width: 25 },
    { header: "Jumlah", key: "amount", width: 15 },
    { header: "Metode", key: "method", width: 14 },
    { header: "Dikonfirmasi Oleh", key: "confirmedBy", width: 18 },
  ];
  for (const p of payments) {
    ws2.addRow({
      confirmedAt: p.confirmedAt ? format(new Date(p.confirmedAt), "dd/MM/yyyy HH:mm") : "-",
      studentName: p.invoice?.student?.name ?? "-",
      amount: p.amount,
      method: p.method,
      confirmedBy: p.user?.name ?? "-",
    });
  }
  ws2.getRow(1).font = { bold: true };

  // Sheet 3: Branch Transactions
  const ws3 = wb.addWorksheet("Transaksi Cabang");
  ws3.columns = [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Tipe", key: "type", width: 14 },
    { header: "Kategori", key: "category", width: 16 },
    { header: "Deskripsi", key: "description", width: 30 },
    { header: "Jumlah", key: "amount", width: 15 },
  ];
  for (const t of transactions) {
    ws3.addRow({
      date: format(new Date(t.date), "dd/MM/yyyy"),
      type: t.type,
      category: t.category ?? "-",
      description: t.note ?? "-",
      amount: t.amount,
    });
  }
  ws3.getRow(1).font = { bold: true };

  // Sheet 4: Commissions
  const ws4 = wb.addWorksheet("Komisi Afiliator");
  ws4.columns = [
    { header: "Tanggal", key: "createdAt", width: 14 },
    { header: "Afiliator", key: "affiliateName", width: 20 },
    { header: "Kode", key: "affiliateCode", width: 12 },
    { header: "Jumlah", key: "amount", width: 15 },
    { header: "Status", key: "status", width: 14 },
  ];
  for (const c of commissions) {
    ws4.addRow({
      createdAt: format(new Date(c.createdAt), "dd/MM/yyyy"),
      affiliateName: c.referral?.affiliate?.name ?? "-",
      affiliateCode: c.referral?.affiliate?.code ?? "-",
      amount: c.amount,
      status: c.status,
    });
  }
  ws4.getRow(1).font = { bold: true };

  // Sheet 5: Summary
  const ws5 = wb.addWorksheet("Ringkasan");
  const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = invoices.filter((i) => ["UNPAID", "OVERDUE", "PENDING"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const totalIncome = transactions.filter((t) => ["INCOME", "TRANSFER_IN"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => ["EXPENSE", "TRANSFER_OUT"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  ws5.addRow(["Laporan Keuangan - LMS Bimbel"]);
  ws5.addRow(["Dicetak", format(new Date(), "dd MMMM yyyy HH:mm", { locale: localeId })]);
  ws5.addRow([]);
  ws5.addRow(["Total Ditagihkan", totalInvoiced]);
  ws5.addRow(["Total Terkumpul", totalCollected]);
  ws5.addRow(["Belum Lunas", totalUnpaid]);
  ws5.addRow(["Tingkat Lunas", totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}%` : "0%"]);
  ws5.addRow([]);
  ws5.addRow(["Pemasukan Cabang", totalIncome]);
  ws5.addRow(["Pengeluaran Cabang", totalExpense]);
  ws5.addRow(["Selisih", totalIncome - totalExpense]);
  ws5.addRow([]);
  ws5.addRow(["Total Komisi Aktif", commissions.filter((c) => ["VALID", "READY_PAYOUT", "PAID"].includes(c.status)).reduce((s, c) => s + c.amount, 0)]);
  ws5.addRow(["Total Komisi Dibayar", commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0)]);
  ws5.getCell("A1").font = { bold: true, size: 14 };
  ws5.getCell("A2").font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laporan-keuangan-${format(new Date(), "yyyy-MM-dd")}.xlsx"`,
    },
  });
}
