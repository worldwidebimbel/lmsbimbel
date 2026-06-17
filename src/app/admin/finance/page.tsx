import { db } from "@/lib/db";
import { formatCurrency, formatDate, getInvoiceStatusColor, getInvoiceStatusLabel } from "@/lib/utils";
import { Wallet, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";

async function getFinanceData() {
  const [invoices, paidSum, unpaidSum, overdueCount] = await Promise.all([
    db.invoice.findMany({
      include: { student: true, plan: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.invoice.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.invoice.aggregate({ where: { status: "UNPAID" }, _sum: { amount: true } }),
    db.invoice.count({ where: { status: "OVERDUE" } }),
  ]);
  return { invoices, paidAmount: paidSum._sum.amount ?? 0, unpaidAmount: unpaidSum._sum.amount ?? 0, overdueCount };
}

export const metadata = { title: "Keuangan" };

export default async function FinancePage() {
  const { invoices, paidAmount, unpaidAmount, overdueCount } = await getFinanceData();

  const cards = [
    { label: "Total Terbayar", value: formatCurrency(paidAmount), icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Belum Dibayar", value: formatCurrency(unpaidAmount), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Jatuh Tempo", value: `${overdueCount} tagihan`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Total Tagihan", value: invoices.length, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Keuangan & Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola tagihan dan konfirmasi pembayaran</p>
        </div>
        <a href="/admin/finance/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Buat Tagihan
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Daftar Tagihan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Siswa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paket</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nominal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jatuh Tempo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada tagihan</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{inv.student.name}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.plan?.name ?? "Manual"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getInvoiceStatusColor(inv.status)}`}>
                        {getInvoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/admin/finance/${inv.id}`} className="text-xs text-blue-600 hover:underline">Detail</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
