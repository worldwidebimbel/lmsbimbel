import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Printer, Building2 } from "lucide-react";
import Link from "next/link";
import ReportControls from "@/components/admin/ReportControls";

export const metadata = { title: "Laporan Keuangan" };

export default async function LaporanKeuanganPage({ searchParams }: { searchParams: Promise<{ branch?: string; period?: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { branch, period } = await searchParams;
  const { isSuperAdmin, branchId, allBranches } = await getBranchScope();
  const selectedBranch = branch && branch !== "all" ? branch : (isSuperAdmin ? undefined : (branchId ?? undefined));
  const selectedPeriod = period ?? "monthly";

  const now = new Date();
  const periods: Record<string, { label: string; start: Date; end: Date }[]> = {
    daily: Array.from({ length: 30 }, (_, i) => {
      const d = subDays(now, i);
      return { label: format(d, "d MMM", { locale: localeId }), start: startOfDay(d), end: endOfDay(d) };
    }).reverse(),
    weekly: Array.from({ length: 12 }, (_, i) => {
      const d = subWeeks(now, i);
      return { label: format(d, "'Minggu' w", { locale: localeId }), start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) };
    }).reverse(),
    monthly: Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, i);
      return { label: format(d, "MMMM yyyy", { locale: localeId }), start: startOfMonth(d), end: endOfMonth(d) };
    }).reverse(),
    yearly: Array.from({ length: 5 }, (_, i) => {
      const d = subYears(now, i);
      return { label: format(d, "yyyy", { locale: localeId }), start: startOfYear(d), end: endOfYear(d) };
    }).reverse(),
  };

  const items = periods[selectedPeriod] ?? periods.monthly;
  const branchFilter = selectedBranch ? { branchId: selectedBranch } : {};

  const [allInvoices, allPayments, branchTransactions, allCommissions, allPayouts] = await Promise.all([
    db.invoice.findMany({
      where: branchFilter,
      include: { student: { select: { name: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({
      where: { confirmedAt: { not: null }, ...branchFilter },
      include: { invoice: { select: { studentId: true } }, user: { select: { name: true } } },
      orderBy: { confirmedAt: "desc" },
    }),
    db.branchTransaction.findMany({
      where: selectedBranch ? { branchId: selectedBranch } : {},
      orderBy: { date: "desc" },
    }),
    db.commission.findMany({
      where: { status: { notIn: ["CANCELLED"] } },
      include: { referral: { select: { affiliate: { select: { code: true, name: true } }, registration: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.commissionPayout.findMany({
      where: { status: { in: ["REQUESTED", "APPROVED", "PAID"] } },
      include: { affiliate: { select: { code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const periodStats = items.map((m) => {
    const invoicesInMonth = allInvoices.filter((i) => i.createdAt >= m.start && i.createdAt <= m.end);
    const paymentsInMonth = allPayments.filter((p) => p.confirmedAt && p.confirmedAt >= m.start && p.confirmedAt <= m.end);
    const incomeTx = branchTransactions.filter((t) => ["INCOME", "TRANSFER_IN"].includes(t.type) && t.date >= m.start && t.date <= m.end).reduce((s, t) => s + t.amount, 0);
    const expenseTx = branchTransactions.filter((t) => ["EXPENSE", "TRANSFER_OUT"].includes(t.type) && t.date >= m.start && t.date <= m.end).reduce((s, t) => s + t.amount, 0);
    return {
      label: m.label,
      invoiced: invoicesInMonth.reduce((s, i) => s + i.amount, 0),
      collected: paymentsInMonth.reduce((s, p) => s + p.amount, 0),
      count: invoicesInMonth.length,
      paidCount: paymentsInMonth.length,
      income: incomeTx,
      expense: expenseTx,
    };
  });

  const totalInvoiced = allInvoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = allPayments.reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = allInvoices.filter((i) => ["UNPAID", "OVERDUE", "PENDING"].includes(i.status)).reduce((s, i) => s + i.amount, 0);
  const pendingCount = allInvoices.filter((i) => i.status === "PENDING").length;
  const overdueCount = allInvoices.filter((i) => i.status === "OVERDUE").length;

  const methodStats: Record<string, number> = {};
  for (const p of allPayments) {
    methodStats[p.method] = (methodStats[p.method] ?? 0) + p.amount;
  }
  const METHOD_LABEL: Record<string, string> = { TRANSFER: "Transfer Bank", CASH: "Tunai", QRIS: "QRIS", MIDTRANS: "Midtrans", XENDIT: "Xendit" };

  const totalCommissionValid = allCommissions.filter((c) => ["VALID", "READY_PAYOUT", "PAID"].includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const totalCommissionPaid = allCommissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0);
  const totalCommissionPending = allCommissions.filter((c) => ["PENDING", "REGISTRATION_VERIFIED", "PAYMENT_VERIFIED"].includes(c.status)).reduce((s, c) => s + c.amount, 0);
  const pendingPayouts = allPayouts.filter((p) => p.status === "REQUESTED");

  const branchName = selectedBranch ? allBranches.find((b) => b.id === selectedBranch)?.name ?? "Cabang" : "Semua Cabang";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-sm text-gray-500">Dicetak: {format(now, "d MMMM yyyy HH:mm", { locale: localeId })} · {branchName}</p>
          </div>
        </div>
        <button onClick={() => {}} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 print:hidden">
          <Printer className="h-4 w-4" /> Cetak
        </button>
      </div>

      <ReportControls branches={allBranches} currentBranch={selectedBranch ?? (isSuperAdmin ? "all" : (branchId ?? "all"))} currentPeriod={selectedPeriod} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Ditagihkan", value: formatCurrency(totalInvoiced), color: "text-gray-900" },
          { label: "Total Terkumpul",  value: formatCurrency(totalCollected), color: "text-green-600" },
          { label: "Belum Lunas",      value: formatCurrency(totalUnpaid), color: "text-orange-600" },
          { label: "Tingkat Lunas",    value: totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}%` : "0%", color: "text-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Period breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Rekap {selectedPeriod === "daily" ? "Harian" : selectedPeriod === "weekly" ? "Mingguan" : selectedPeriod === "yearly" ? "Tahunan" : "Bulanan"}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {periodStats.map((m) => (
              <div key={m.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800">{m.label}</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(m.collected)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>Ditagihkan: {formatCurrency(m.invoiced)}</span>
                  <span>{m.paidCount}/{m.count} tagihan lunas</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>Pemasukan cabang: {formatCurrency(m.income)}</span>
                  <span>Pengeluaran: {formatCurrency(m.expense)}</span>
                </div>
                {m.invoiced > 0 && (
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min((m.collected / m.invoiced) * 100, 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Metode pembayaran */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-900">Per Metode Pembayaran</h2>
            </div>
            {Object.keys(methodStats).length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Belum ada pembayaran terkonfirmasi</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(methodStats).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-gray-700">{METHOD_LABEL[method] ?? method}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status summary */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-900">Status Tagihan Saat Ini</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { label: "Lunas",                count: allInvoices.filter((i) => i.status === "PAID").length,       color: "text-green-600" },
                { label: "Menunggu Konfirmasi",  count: pendingCount,                                                 color: "text-blue-600" },
                { label: "Belum Bayar",          count: allInvoices.filter((i) => i.status === "UNPAID").length,     color: "text-orange-600" },
                { label: "Jatuh Tempo",          count: overdueCount,                                                 color: "text-red-600" },
                { label: "Dibatalkan",           count: allInvoices.filter((i) => i.status === "CANCELLED").length,  color: "text-gray-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className={`text-sm font-semibold ${s.color}`}>{s.count} tagihan</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Commission Summary */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Komisi Afiliator</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 p-5">
          <div>
            <p className="text-xs text-gray-500">Total Komisi Aktif</p>
            <p className="mt-1 text-lg font-bold text-indigo-600">{formatCurrency(totalCommissionValid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sudah Dibayar</p>
            <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(totalCommissionPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pending</p>
            <p className="mt-1 text-lg font-bold text-orange-600">{formatCurrency(totalCommissionPending)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pencairan Diajukan</p>
            <p className="mt-1 text-lg font-bold text-blue-600">{pendingPayouts.length}</p>
          </div>
        </div>
        {pendingPayouts.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="px-5 py-2 bg-blue-50">
              <p className="text-xs font-medium text-blue-700">Menunggu Persetujuan Pencairan</p>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingPayouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.affiliate.name} ({p.affiliate.code})</p>
                    <p className="text-xs text-gray-400">Diajukan: {format(new Date(p.createdAt), "d MMM yyyy", { locale: localeId })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)}</p>
                    <Link href="/admin/afiliator/pencairan" className="text-xs text-blue-600 hover:underline print:hidden">Proses →</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending QRIS table */}
      {pendingCount > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white overflow-hidden">
          <div className="border-b border-blue-100 bg-blue-50 px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-blue-900">Menunggu Konfirmasi QRIS ({pendingCount})</h2>
            <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline print:hidden">Kelola →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {allInvoices.filter((i) => i.status === "PENDING").map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.student.name}</p>
                  <p className="text-xs text-gray-400">{inv.plan?.name ?? "Manual"} · Jatuh tempo: {format(new Date(inv.dueDate), "d MMM yyyy", { locale: localeId })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.amount)}</p>
                  <Link href={`/admin/finance/${inv.id}`} className="text-xs text-blue-600 hover:underline print:hidden">Konfirmasi →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
