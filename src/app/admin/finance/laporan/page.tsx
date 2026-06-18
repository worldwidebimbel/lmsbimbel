import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Laporan Keuangan" };

export default async function LaporanKeuanganPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const now = new Date();
  // Last 6 months data
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, i);
    return { start: startOfMonth(d), end: endOfMonth(d), label: format(d, "MMMM yyyy", { locale: localeId }) };
  }).reverse();

  const [allInvoices, allPayments] = await Promise.all([
    db.invoice.findMany({
      include: { student: { select: { name: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({
      where: { confirmedAt: { not: null } },
      include: { invoice: { select: { studentId: true } }, user: { select: { name: true } } },
      orderBy: { confirmedAt: "desc" },
    }),
  ]);

  const monthlyStats = months.map((m) => {
    const invoicesInMonth = allInvoices.filter((i) => i.createdAt >= m.start && i.createdAt <= m.end);
    const paymentsInMonth = allPayments.filter((p) => p.confirmedAt && p.confirmedAt >= m.start && p.confirmedAt <= m.end);
    return {
      label: m.label,
      invoiced: invoicesInMonth.reduce((s, i) => s + i.amount, 0),
      collected: paymentsInMonth.reduce((s, p) => s + p.amount, 0),
      count: invoicesInMonth.length,
      paidCount: paymentsInMonth.length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
            <p className="text-sm text-gray-500">Dicetak: {format(now, "d MMMM yyyy HH:mm", { locale: localeId })}</p>
          </div>
        </div>
        <button onClick={() => {}} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 print:hidden">
          <Printer className="h-4 w-4" /> Cetak
        </button>
      </div>

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
        {/* Monthly breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Rekap 6 Bulan Terakhir</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {monthlyStats.map((m) => (
              <div key={m.label} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-800">{m.label}</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(m.collected)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>Ditagihkan: {formatCurrency(m.invoiced)}</span>
                  <span>{m.paidCount}/{m.count} tagihan lunas</span>
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
