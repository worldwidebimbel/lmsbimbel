"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { ArrowRightLeft, TrendingUp, TrendingDown, CheckCircle, XCircle, Hourglass, Building2 } from "lucide-react";

interface Branch { id: string; name: string; code: string }
interface Transaction {
  id: string; type: string; category: string; amount: number; date: string; note: string | null;
  branch: Branch; creator: { name: string };
}
interface Transfer {
  id: string; fromBranch: Branch; toBranch: Branch; amount: number; status: string; note: string | null; createdAt: string;
  requester: { name: string };
}

const TYPE_LABEL: Record<string, string> = { INCOME: "Pemasukan", EXPENSE: "Pengeluaran", TRANSFER_IN: "Transfer Masuk", TRANSFER_OUT: "Transfer Keluar" };
const TYPE_COLOR: Record<string, string> = { INCOME: "text-green-600", EXPENSE: "text-red-600", TRANSFER_IN: "text-blue-600", TRANSFER_OUT: "text-orange-600" };
const STATUS_LABEL: Record<string, string> = { PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak" };

export default function BranchTransactionClient({ transactions, transfers, branches, defaultBranchId, isSuperAdmin }: {
  transactions: Transaction[];
  transfers: Transfer[];
  branches: Branch[];
  defaultBranchId: string | null;
  isSuperAdmin: boolean;
}) {
  const [tab, setTab] = useState<"transactions" | "transfers">("transactions");
  const [filterBranch, setFilterBranch] = useState<string>(defaultBranchId ?? "all");

  const filteredTx = filterBranch === "all" ? transactions : transactions.filter((t) => t.branch.id === filterBranch);

  async function handleTransferStatus(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/branches/transfers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button onClick={() => setTab("transactions")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "transactions" ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-50"}`}>
            Transaksi
          </button>
          <button onClick={() => setTab("transfers")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "transfers" ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-50"}`}>
            Transfer Antar Cabang
          </button>
        </div>
        {branches.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-transparent text-sm outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {tab === "transactions" ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cabang</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nominal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTx.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada transaksi</td></tr>
              ) : (
                filteredTx.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(t.date), "d MMM yyyy", { locale: localeId })}</td>
                    <td className="px-4 py-3 text-gray-600">{t.branch.name} ({t.branch.code})</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${TYPE_COLOR[t.type]}`}>
                        {t.type === "INCOME" || t.type === "TRANSFER_IN" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {TYPE_LABEL[t.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.category}</td>
                    <td className={`px-4 py-3 font-semibold ${TYPE_COLOR[t.type]}`}>{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{t.creator.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dari → Ke</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nominal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Diajukan Oleh</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada transfer</td></tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(t.createdAt), "d MMM yyyy", { locale: localeId })}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        {t.fromBranch.name} <ArrowRightLeft className="h-3 w-3 text-gray-500" /> {t.toBranch.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.status === "APPROVED" ? "bg-green-100 text-green-700" : t.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.requester.name}</td>
                    <td className="px-4 py-3">
                      {t.status === "PENDING" && isSuperAdmin && (
                        <div className="flex gap-2">
                          <button onClick={() => handleTransferStatus(t.id, "APPROVED")} className="text-green-600 hover:text-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleTransferStatus(t.id, "REJECTED")} className="text-red-600 hover:text-red-700">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
