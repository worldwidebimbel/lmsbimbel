import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { format, differenceInDays, isPast } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Bell, AlertCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";
import OverdueClient from "@/components/admin/OverdueClient";

export const metadata = { title: "Daftar Tunggakan" };

export default async function OverduePage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { branchId, allBranches, isSuperAdmin } = await getBranchScope();
  const branchFilter = isSuperAdmin ? {} : { branchId: branchId ?? undefined };

  const now = new Date();
  const overdueInvoices = await db.invoice.findMany({
    where: {
      ...branchFilter,
      status: { in: ["UNPAID", "OVERDUE"] },
      dueDate: { lt: now },
    },
    include: { student: { select: { id: true, name: true, email: true, profile: { select: { phone: true } } } }, plan: { select: { name: true } }, branch: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const stats = {
    total: overdueInvoices.length,
    amount: overdueInvoices.reduce((s, i) => s + i.amount, 0),
    critical: overdueInvoices.filter((i) => isPast(new Date(i.dueDate)) && differenceInDays(now, new Date(i.dueDate)) >= 7).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daftar Tunggakan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tagihan yang sudah melewati jatuh tempo dan belum lunas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Tunggakan", value: formatCurrency(stats.amount), color: "text-gray-900" },
          { label: "Jumlah Tagihan", value: stats.total, color: "text-orange-600" },
          { label: "Kritis (>7 hari)", value: stats.critical, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <OverdueClient
        invoices={JSON.parse(JSON.stringify(overdueInvoices))}
        branches={allBranches}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
