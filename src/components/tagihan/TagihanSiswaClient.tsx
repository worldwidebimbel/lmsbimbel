"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Wallet, CheckCircle, Clock, AlertCircle, XCircle, QrCode, Upload, X, Loader2, Hourglass, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Payment { id: string; amount: number; confirmedAt: string | null; proofUrl: string | null }
interface Invoice {
  id: string; amount: number; dueDate: string; status: string;
  note: string | null; plan: { name: string } | null; payments: Payment[];
}
interface QrisConfig { imageUrl: string | null; bankName: string | null; accountName: string | null; accountNumber: string | null }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  PAID:      { label: "Lunas",              color: "text-green-700",  bg: "bg-green-100",  Icon: CheckCircle },
  UNPAID:    { label: "Belum Bayar",        color: "text-orange-700", bg: "bg-orange-100", Icon: Clock },
  PENDING:   { label: "Menunggu Konfirmasi",color: "text-blue-700",   bg: "bg-blue-100",   Icon: Hourglass },
  OVERDUE:   { label: "Jatuh Tempo",        color: "text-red-700",    bg: "bg-red-100",    Icon: AlertCircle },
  CANCELLED: { label: "Dibatalkan",         color: "text-gray-500",   bg: "bg-gray-100",   Icon: XCircle },
};

interface Props {
  invoices: Invoice[];
  summary: { total: number; paid: number; unpaid: number; overdue: number };
  qris: QrisConfig;
  cloudinaryConfigured: boolean;
}

export default function TagihanSiswaClient({ invoices: initial, summary, qris, cloudinaryConfigured }: Props) {
  const [invoices, setInvoices] = useState(initial);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function openPayModal(inv: Invoice) {
    setActiveInvoice(inv);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setFile(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setUploadedUrl(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "bukti-bayar");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Gagal upload bukti");
        return;
      }
      const d = await res.json();
      setUploadedUrl(d.url);
      toast.success("Bukti berhasil diupload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmitPayment() {
    if (!activeInvoice || !uploadedUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/siswa/tagihan/${activeInvoice.id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: uploadedUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Gagal kirim bukti");
        return;
      }
      toast.success("Bukti pembayaran terkirim! Menunggu konfirmasi admin.");
      setInvoices((prev) => prev.map((inv) => inv.id === activeInvoice.id ? { ...inv, status: "PENDING" } : inv));
      setActiveInvoice(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Tagihan",  value: formatCurrency(summary.total),  color: "text-gray-900" },
          { label: "Sudah Dibayar", value: formatCurrency(summary.paid),   color: "text-green-600" },
          { label: "Belum Dibayar", value: formatCurrency(summary.unpaid), color: "text-orange-600" },
          { label: "Jatuh Tempo",   value: `${summary.overdue} tagihan`,   color: summary.overdue > 0 ? "text-red-600" : "text-gray-400" },
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
            const isPayable = ["UNPAID", "OVERDUE"].includes(inv.status);
            const isPending = inv.status === "PENDING";
            const pendingProof = isPending ? inv.payments.find((p) => !p.confirmedAt)?.proofUrl : null;

            return (
              <div key={inv.id} className={`rounded-xl border bg-white p-4 space-y-3 ${inv.status === "OVERDUE" ? "border-red-200" : inv.status === "PENDING" ? "border-blue-200" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(inv.amount)}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{inv.plan?.name ?? "Tagihan Manual"}</p>
                    <p className="text-xs text-gray-400">
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

                {isPending && (
                  <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-800 flex items-start gap-2">
                    <Hourglass className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Menunggu konfirmasi admin</p>
                      <p className="text-xs text-blue-600 mt-0.5">Bukti pembayaran sudah diterima. Kami akan segera memproses.</p>
                    </div>
                    {pendingProof && (
                      <a href={pendingProof} target="_blank" rel="noopener noreferrer"
                        className="ml-auto shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> Lihat Bukti
                      </a>
                    )}
                  </div>
                )}

                {isPayable && (
                  <button onClick={() => openPayModal(inv)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    <QrCode className="h-4 w-4" /> Bayar dengan QRIS
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QRIS Payment Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <h2 className="font-bold text-gray-900">Bayar dengan QRIS</h2>
              <button onClick={() => setActiveInvoice(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-xl bg-orange-50 p-3 text-center">
                <p className="text-sm text-gray-600">Total yang dibayar</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(activeInvoice.amount)}</p>
              </div>

              {qris.imageUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border-2 border-gray-200 p-3 bg-white">
                    <img src={qris.imageUrl} alt="QRIS Code" className="h-52 w-52 object-contain" />
                  </div>
                  {qris.accountName && (
                    <div className="text-center text-sm text-gray-700">
                      <p className="font-semibold">{qris.accountName}</p>
                      {qris.bankName && <p className="text-xs text-gray-400">{qris.bankName}{qris.accountNumber ? ` · ${qris.accountNumber}` : ""}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8">
                  <QrCode className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-400">QRIS belum dikonfigurasi admin</p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 space-y-1.5">
                <p className="font-semibold text-gray-800">Cara Bayar:</p>
                <p>1. Buka aplikasi dompet digital atau m-Banking</p>
                <p>2. Pilih "Scan QR" atau "Bayar via QR"</p>
                <p>3. Arahkan kamera ke kode QRIS di atas</p>
                <p>4. Konfirmasi nominal & bayar</p>
                <p>5. Screenshot bukti pembayaran & upload di bawah</p>
              </div>

              {cloudinaryConfigured ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Upload Bukti Pembayaran</p>
                  <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${previewUrl ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="max-h-36 rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-7 w-7 text-gray-400" />
                        <p className="text-sm text-gray-500">Klik untuk pilih gambar bukti bayar</p>
                        <p className="text-xs text-gray-400">JPG, PNG, maks 5MB</p>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>

                  {file && !uploadedUrl && (
                    <button onClick={handleUpload} disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-700 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Mengupload..." : "Upload Bukti"}
                    </button>
                  )}

                  {uploadedUrl && (
                    <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Bukti berhasil diupload
                    </div>
                  )}

                  <button onClick={handleSubmitPayment} disabled={!uploadedUrl || submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Kirim Bukti Pembayaran
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Upload bukti belum aktif. Hubungi admin untuk konfirmasi pembayaran secara manual.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
