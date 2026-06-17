"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle, Loader2, Clock, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Payment { id: string; amount: number; method: string; confirmedAt: string | null; user: { name: string } }
interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  note: string | null;
  student: { id: string; name: string; email: string };
  plan: { name: string } | null;
  payments: Payment[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PAID:      { label: "Lunas",       color: "text-green-700",  bg: "bg-green-100",  Icon: CheckCircle },
  UNPAID:    { label: "Belum Bayar", color: "text-orange-700", bg: "bg-orange-100", Icon: Clock },
  OVERDUE:   { label: "Jatuh Tempo", color: "text-red-700",    bg: "bg-red-100",    Icon: AlertCircle },
  CANCELLED: { label: "Dibatalkan",  color: "text-gray-500",   bg: "bg-gray-100",   Icon: XCircle },
};

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: "Transfer Bank", CASH: "Tunai", MIDTRANS: "Midtrans",
};

export default function InvoiceDetailClient({ invoice, totalPaid }: { invoice: Invoice; totalPaid: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmForm, setConfirmForm] = useState({ method: "CASH", amount: String(invoice.amount - totalPaid) });
  const [status, setStatus] = useState(invoice.status);
  const [payments, setPayments] = useState<Payment[]>(invoice.payments);
  const [error, setError] = useState("");

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNPAID;
  const Icon = cfg.Icon;
  const remaining = invoice.amount - payments.reduce((s, p) => s + p.amount, 0);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(confirmForm.amount), method: confirmForm.method }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal konfirmasi");
        return;
      }
      const p = await res.json();
      setPayments((prev) => [p, ...prev]);
      setStatus("PAID");
      setShowConfirm(false);
      router.refresh();
    });
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/admin/finance/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Info Tagihan</h3>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-4 w-4" />
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Siswa</p>
            <p className="font-medium text-gray-900">{invoice.student.name}</p>
            <p className="text-xs text-gray-400">{invoice.student.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Paket</p>
            <p className="font-medium text-gray-900">{invoice.plan?.name ?? "Manual"}</p>
          </div>
          <div>
            <p className="text-gray-500">Nominal</p>
            <p className="font-bold text-lg text-gray-900">{formatCurrency(invoice.amount)}</p>
          </div>
          <div>
            <p className="text-gray-500">Jatuh Tempo</p>
            <p className="font-medium text-gray-900">
              {format(new Date(invoice.dueDate), "d MMMM yyyy", { locale: localeId })}
            </p>
          </div>
          {remaining > 0 && status !== "PAID" && (
            <div className="col-span-2">
              <p className="text-gray-500">Sisa</p>
              <p className="font-bold text-orange-600">{formatCurrency(remaining)}</p>
            </div>
          )}
          {invoice.note && (
            <div className="col-span-2">
              <p className="text-gray-500">Catatan</p>
              <p className="text-gray-700">{invoice.note}</p>
            </div>
          )}
        </div>

        {status !== "PAID" && status !== "CANCELLED" && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Konfirmasi Pembayaran
            </button>
            <button
              onClick={() => handleStatusChange("OVERDUE")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
            >
              Tandai Jatuh Tempo
            </button>
            <button
              onClick={() => handleStatusChange("CANCELLED")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Batalkan
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Konfirmasi Pembayaran</h3>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <form onSubmit={handleConfirm} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nominal</label>
              <input
                type="number"
                required
                value={confirmForm.amount}
                onChange={(e) => setConfirmForm((p) => ({ ...p, amount: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none w-36"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Metode</label>
              <select
                value={confirmForm.method}
                onChange={(e) => setConfirmForm((p) => ({ ...p, method: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              >
                {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Konfirmasi
            </button>
            <button type="button" onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Batal
            </button>
          </form>
        </div>
      )}

      {payments.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="font-semibold text-gray-900">Riwayat Pembayaran</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-gray-400">
                    {METHOD_LABEL[p.method] ?? p.method} · Dikonfirmasi oleh {p.user.name}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {p.confirmedAt ? format(new Date(p.confirmedAt), "d MMM yyyy", { locale: localeId }) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
