import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wallet, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Tagihan" };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PAID:      { label: "Lunas",       color: "text-green-700",  bg: "bg-green-100",  Icon: CheckCircle },
  UNPAID:    { label: "Belum Bayar", color: "text-orange-700", bg: "bg-orange-100", Icon: Clock },
  OVERDUE:   { label: "Jatuh Tempo", color: "text-red-700",    bg: "bg-red-100",    Icon: AlertCircle },
  CANCELLED: { label: "Dibatalkan",  color: "text-gray-500",   bg: "bg-gray-100",   Icon: XCircle },
};

export default async function SiswaTagihanPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const invoices = await db.invoice.findMany({
    where: { studentId: session.user.id },
    include: {
      plan: { select: { name: true } },
      payments: { select: { id: true, amount: true, confirmedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const unpaid = invoices.filter((i) => i.status === "UNPAID").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tagihan</h1>
          <p className="text-sm text-gray-500">Riwayat tagihan dan status pembayaran</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tagihan", value: formatCurrency(total), color: "text-gray-900" },
          { label: "Sudah Dibayar", value: formatCurrency(paid), color: "text-green-600" },
          { label: "Belum Dibayar", value: formatCurrency(unpaid), color: "text-orange-600" },
          { label: "Jatuh Tempo", value: `${overdue} tagihan`, color: overdue > 0 ? "text-red-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Wallet className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada tagihan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.UNPAID;
            const Icon = cfg.Icon;
            const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0);
            const isOverdue = inv.status === "OVERDUE" || (inv.status === "UNPAID" && new Date(inv.dueDate) < new Date());
            return (
              <div key={inv.id} className={`rounded-xl border bg-white p-4 ${isOverdue && inv.status !== "PAID" ? "border-red-200" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{formatCurrency(inv.amount)}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{inv.plan?.name ?? "Tagihan Manual"}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Jatuh tempo: {format(new Date(inv.dueDate), "d MMMM yyyy", { locale: localeId })}
                    </p>
                    {inv.note && <p className="mt-1 text-xs italic text-gray-400">{inv.note}</p>}
                  </div>
                  {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Sisa</p>
                      <p className="font-bold text-orange-600">{formatCurrency(inv.amount - totalPaid)}</p>
                    </div>
                  )}
                </div>
                {totalPaid > 0 && inv.status !== "PAID" && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Terbayar</span>
                      <span>{formatCurrency(totalPaid)} / {formatCurrency(inv.amount)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${Math.min((totalPaid / inv.amount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
