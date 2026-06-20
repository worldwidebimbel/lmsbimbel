import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Wallet, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import BranchTransactionClient from "@/components/admin/BranchTransactionClient";

export const metadata = { title: "Transaksi Cabang" };

export default async function BranchTransactionsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { isSuperAdmin, branchId, allBranches } = await getBranchScope();
  const activeBranchIds = isSuperAdmin ? allBranches.map((b) => b.id) : [branchId].filter(Boolean) as string[];

  const [transactions, transfers] = await Promise.all([
    db.branchTransaction.findMany({
      where: { branchId: { in: activeBranchIds } },
      include: { branch: { select: { id: true, name: true, code: true } }, creator: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    db.branchCashTransfer.findMany({
      where: isSuperAdmin ? {} : { OR: [{ fromBranchId: { in: activeBranchIds } }, { toBranchId: { in: activeBranchIds } }] },
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
        requester: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const income = transactions.filter((t) => ["INCOME", "TRANSFER_IN"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => ["EXPENSE", "TRANSFER_OUT"].includes(t.type)).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaksi & Pengeluaran Cabang</h1>
            <p className="text-sm text-gray-500 mt-0.5">Catat pemasukan, pengeluaran operasional, gaji, dan transfer antar cabang</p>
          </div>
        </div>
        <Link
          href="/admin/finance/transactions/new"
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> Catat Transaksi
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Pemasukan", value: income, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Pengeluaran", value: expense, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
          { label: "Saldo Net", value: income - expense, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Transfer Tertunda", value: transfers.filter((t) => t.status === "PENDING").length, icon: ArrowRightLeft, color: "text-orange-600", bg: "bg-orange-50", isCount: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.isCount ? s.value : formatCurrency(s.value)}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <BranchTransactionClient
        transactions={JSON.parse(JSON.stringify(transactions))}
        transfers={JSON.parse(JSON.stringify(transfers))}
        branches={allBranches}
        defaultBranchId={branchId}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
