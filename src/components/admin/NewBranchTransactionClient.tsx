"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import Link from "next/link";

interface Branch { id: string; name: string; code: string }

const CATEGORIES = ["Gaji Karyawan", "Operasional", "Sewa", "Listrik & Air", "Internet", "Perlengkapan", "Pemasukan Lain", "Lainnya"];

export default function NewBranchTransactionClient({ branches, defaultBranchId, isSuperAdmin }: { branches: Branch[]; defaultBranchId: string | null; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    branchId: defaultBranchId ?? "",
    type: "EXPENSE",
    category: "Operasional",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/branches/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal mencatat transaksi");
        return;
      }
      router.push("/admin/finance/transactions");
      router.refresh();
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance/transactions" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catat Transaksi Cabang</h1>
          <p className="text-sm text-gray-500">Pemasukan, pengeluaran, atau gaji</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Cabang *</label>
          <select
            required
            value={form.branchId}
            onChange={(e) => update("branchId", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Pilih cabang</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipe *</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="INCOME">Pemasukan</option>
            <option value="EXPENSE">Pengeluaran</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Kategori *</label>
          <select
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nominal (Rp) *</label>
          <input
            required
            type="number"
            min={1}
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tanggal *</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Catatan</label>
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href="/admin/finance/transactions" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Batal
          </Link>
          <button type="submit" disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
