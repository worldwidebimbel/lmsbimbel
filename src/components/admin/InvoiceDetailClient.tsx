"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle, Loader2, Clock, XCircle, AlertCircle, Hourglass, ExternalLink, ThumbsUp, ThumbsDown, Bell, Printer } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Payment { id: string; amount: number; method: string; confirmedAt: string | null; proofUrl: string | null; user: { name: string } }
interface Invoice {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  note: string | null;
  meetingCount: number | null;
  meetingUsage: number;
  enableOnlinePayment: boolean;
  onlinePaymentMethod: string | null;
  branch: { name: string; code: string } | null;
  student: { id: string; name: string; email: string };
  plan: { name: string; type?: string; meetingCount?: number | null } | null;
  payments: Payment[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PAID:      { label: "Lunas",                 color: "text-green-700",  bg: "bg-green-100",  Icon: CheckCircle },
  UNPAID:    { label: "Belum Bayar",           color: "text-orange-700", bg: "bg-orange-100", Icon: Clock },
  PENDING:   { label: "Menunggu Konfirmasi",   color: "text-blue-700",   bg: "bg-blue-100",   Icon: Hourglass },
  OVERDUE:   { label: "Jatuh Tempo",           color: "text-red-700",    bg: "bg-red-100",    Icon: AlertCircle },
  CANCELLED: { label: "Dibatalkan",            color: "text-gray-500",   bg: "bg-gray-100",   Icon: XCircle },
};

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: "Transfer Bank", CASH: "Tunai", QRIS: "QRIS", MIDTRANS: "Midtrans", XENDIT: "Xendit",
};

export default function InvoiceDetailClient({ invoice, totalPaid }: { invoice: Invoice; totalPaid: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmForm, setConfirmForm] = useState({ method: "CASH", amount: String(invoice.amount - totalPaid) });
  const [status, setStatus] = useState(invoice.status);
  const [payments, setPayments] = useState<Payment[]>(invoice.payments);
  const [error, setError] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [meetingUsage, setMeetingUsage] = useState(invoice.meetingUsage);
  const [updatingMeeting, setUpdatingMeeting] = useState(false);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.UNPAID;
  const isMeetingPackage = invoice.meetingCount !== null && invoice.meetingCount > 0;
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

  async function handleApprove() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}/approve`, { method: "POST" });
      if (res.ok) {
        setStatus("PAID");
        setPayments((prev) => prev.map((p) => !p.confirmedAt ? { ...p, confirmedAt: new Date().toISOString() } : p));
        toast.success("Pembayaran QRIS dikonfirmasi");
        router.refresh();
      } else toast.error("Gagal konfirmasi");
    });
  }

  async function handleReject() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason || "Bukti tidak valid" }),
      });
      if (res.ok) {
        setStatus("UNPAID");
        setPayments((prev) => prev.filter((p) => p.confirmedAt !== null));
        setShowReject(false);
        toast.success("Bukti ditolak, tagihan dikembalikan ke UNPAID");
        router.refresh();
      } else toast.error("Gagal menolak");
    });
  }

  async function handleSendReminder() {
    setSendingReminder(true);
    try {
      const res = await fetch(`/api/admin/finance/reminder`, { method: "POST" });
      const d = await res.json();
      toast.success(`Reminder terkirim ke ${d.sent} siswa`);
    } finally { setSendingReminder(false); }
  }

  async function handleMeetingUsage(delta: number) {
    setUpdatingMeeting(true);
    try {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}/meetings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) });
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setMeetingUsage(data.meetingUsage);
      toast.success("Pertemuan diperbarui");
    } catch {
      toast.error("Gagal memperbarui pertemuan");
    } finally { setUpdatingMeeting(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Info Tagihan</h3>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/finance/${invoice.id}/invoice`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" /> Cetak Invoice
            </Link>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${cfg.bg} ${cfg.color}`}>
              <Icon className="h-4 w-4" />
              {cfg.label}
            </span>
          </div>
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
            {invoice.plan?.type === "MEETING_PACKAGE" && <p className="text-xs text-blue-600">Paket Pertemuan</p>}
          </div>
          <div>
            <p className="text-gray-500">Cabang</p>
            <p className="font-medium text-gray-900">{invoice.branch?.name ?? "Pusat"}</p>
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
          {invoice.enableOnlinePayment && (
            <div className="col-span-2">
              <p className="text-gray-500">Pembayaran Online</p>
              <p className="text-sm font-medium text-emerald-700">
                Aktif ({invoice.onlinePaymentMethod}) — siswa dapat membayar langsung via gateway.
              </p>
            </div>
          )}
          {isMeetingPackage && (
            <div className="col-span-2 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Paket Pertemuan</p>
                  <p className="text-sm text-blue-900 mt-0.5">
                    {meetingUsage} / {invoice.meetingCount} pertemuan digunakan
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMeetingUsage(-1)}
                    disabled={updatingMeeting || meetingUsage <= 0}
                    className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleMeetingUsage(1)}
                    disabled={updatingMeeting || meetingUsage >= (invoice.meetingCount ?? 0)}
                    className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
              {meetingUsage >= (invoice.meetingCount ?? 0) && (
                <p className="text-xs text-red-600 mt-2">Paket pertemuan telah habis.</p>
              )}
            </div>
          )}
        </div>

        {status !== "PAID" && status !== "CANCELLED" && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {status === "PENDING" ? (
              <>
                <button onClick={handleApprove} disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                  Setujui QRIS
                </button>
                <button onClick={() => setShowReject(true)}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100">
                  <ThumbsDown className="h-4 w-4" /> Tolak Bukti
                </button>
              </>
            ) : (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                <CheckCircle className="h-4 w-4" /> Konfirmasi Pembayaran
              </button>
            )}
            {status !== "PENDING" && (
              <>
                <button onClick={() => handleStatusChange("OVERDUE")}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100">
                  Tandai Jatuh Tempo
                </button>
                <button onClick={() => handleStatusChange("CANCELLED")}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Batalkan
                </button>
                <button onClick={handleSendReminder} disabled={sendingReminder}
                  className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 hover:bg-orange-100 disabled:opacity-50">
                  {sendingReminder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                  Kirim Reminder
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {status === "PENDING" && (() => {
        const proof = payments.find((p) => !p.confirmedAt && p.proofUrl);
        return proof ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bukti Pembayaran QRIS</h3>
              <a href={proof.proofUrl!} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Buka Asli
              </a>
            </div>
            <img src={proof.proofUrl!} alt="Bukti Bayar" className="max-h-60 rounded-lg border border-gray-200 object-contain" />
          </div>
        ) : null;
      })()}

      {showReject && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Alasan Penolakan</h3>
          <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Contoh: Nominal tidak sesuai, gambar buram..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Tolak Bukti
            </button>
            <button onClick={() => setShowReject(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-600">Batal</button>
          </div>
        </div>
      )}

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
                    {METHOD_LABEL[p.method] ?? p.method} · {p.confirmedAt ? `Dikonfirmasi oleh ${p.user.name}` : "Menunggu konfirmasi"}
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
