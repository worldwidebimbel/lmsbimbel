"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Student { id: string; name: string; email: string; defaultBranchId?: string | null }
interface Plan { id: string; name: string; amount: number; period: string; type?: string; meetingCount?: number | null }
interface Branch { id: string; name: string; code: string }

export default function NewInvoiceClient({ students, plans, branches, defaultBranchId, isSuperAdmin }: { students: Student[]; plans: Plan[]; branches: Branch[]; defaultBranchId: string | null; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    planId: "",
    branchId: defaultBranchId ?? "",
    amount: "",
    dueDate: "",
    note: "",
    enableOnlinePayment: false,
    onlinePaymentMethod: "MIDTRANS",
  });

  function update(k: string, v: string | boolean) { setForm((p) => ({ ...p, [k]: v })); }

  function onPlanChange(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      planId,
      amount: plan ? String(plan.amount) : prev.amount,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal membuat tagihan");
        return;
      }
      const inv = await res.json();
      router.push(`/admin/finance/${inv.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Siswa *</label>
        <select
          required
          value={form.studentId}
          onChange={(e) => {
            const studentId = e.target.value;
            const student = students.find((s) => s.id === studentId);
            setForm((p) => ({
              ...p,
              studentId,
              branchId: isSuperAdmin ? (student?.defaultBranchId ?? p.branchId) : p.branchId,
            }));
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Pilih siswa</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.email}</option>)}
        </select>
      </div>

      {isSuperAdmin && (
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
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Paket Pembayaran <span className="text-gray-500">(opsional)</span></label>
        <select
          value={form.planId}
          onChange={(e) => onPlanChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Manual (tanpa paket)</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — Rp {p.amount.toLocaleString("id-ID")}
              {p.type === "MEETING_PACKAGE" && p.meetingCount ? ` (${p.meetingCount} pertemuan)` : ` / ${p.period}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nominal (Rp) *</label>
        <input
          required
          type="number"
          min={1000}
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Jatuh Tempo *</label>
        <input
          required
          type="date"
          value={form.dueDate}
          onChange={(e) => update("dueDate", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Catatan</label>
        <textarea
          value={form.note}
          onChange={(e) => update("note", e.target.value)}
          rows={2}
          placeholder="Keterangan tagihan..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.enableOnlinePayment}
            onChange={(e) => update("enableOnlinePayment", e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Aktifkan pembayaran online</p>
            <p className="text-xs text-gray-500">Siswa dapat membayar via gateway yang dipilih.</p>
          </div>
        </label>

        {form.enableOnlinePayment && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Gateway</label>
            <select
              value={form.onlinePaymentMethod}
              onChange={(e) => update("onlinePaymentMethod", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="MIDTRANS">Midtrans</option>
              <option value="XENDIT">Xendit</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Link href="/admin/finance" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Batal
        </Link>
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Buat Tagihan
        </button>
      </div>
    </form>
  );
}
