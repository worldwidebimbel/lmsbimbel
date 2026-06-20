"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { Bell, Phone, Mail, AlertTriangle, Loader2, Building2 } from "lucide-react";
import Link from "next/link";

interface Branch { id: string; name: string; code: string }
interface Invoice {
  id: string; amount: number; dueDate: string; status: string;
  student: { id: string; name: string; email: string; profile: { phone: string | null } | null };
  plan: { name: string } | null;
  branch: { id: string; name: string } | null;
}

export default function OverdueClient({ invoices, branches, isSuperAdmin }: { invoices: Invoice[]; branches: Branch[]; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = filterBranch === "all" ? invoices : invoices.filter((i) => i.branch?.id === filterBranch);

  async function remind(invoice: Invoice, type: "email" | "whatsapp") {
    setLoading(`${invoice.id}-${type}`);
    const res = await fetch("/api/admin/finance/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds: [invoice.id], channels: [type] }),
    });
    const data = await res.json();
    setLoading(null);
    setToast(data.message ?? (res.ok ? "Reminder terkirim" : "Gagal mengirim reminder"));
    setTimeout(() => setToast(null), 3000);
  }

  async function remindAll() {
    setLoading("all");
    const res = await fetch("/api/admin/finance/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceIds: filtered.map((i) => i.id), channels: ["email", "whatsapp"] }),
    });
    const data = await res.json();
    setLoading(null);
    setToast(data.message ?? (res.ok ? "Reminder terkirim" : "Gagal mengirim reminder"));
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{toast}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isSuperAdmin && branches.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="bg-transparent text-sm outline-none">
              <option value="all">Semua Cabang</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <button
          onClick={remindAll}
          disabled={loading === "all" || filtered.length === 0}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          Reminder Semua
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Siswa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cabang</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jatuh Tempo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nominal</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada tunggakan</td></tr>
            ) : (
              filtered.map((inv) => {
                const days = differenceInDays(new Date(), new Date(inv.dueDate));
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{inv.student.name}</p>
                      <p className="text-xs text-gray-500">{inv.student.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inv.branch?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {format(new Date(inv.dueDate), "d MMM yyyy", { locale: localeId })} ({days} hari)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => remind(inv, "email")}
                          disabled={loading === `${inv.id}-email`}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                          title="Kirim email"
                        >
                          {loading === `${inv.id}-email` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </button>
                        {inv.student.profile?.phone && (
                          <button
                            onClick={() => remind(inv, "whatsapp")}
                            disabled={loading === `${inv.id}-whatsapp`}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            title="Kirim WhatsApp"
                          >
                            {loading === `${inv.id}-whatsapp` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                          </button>
                        )}
                        <Link href={`/admin/finance/${inv.id}`} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100">
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
