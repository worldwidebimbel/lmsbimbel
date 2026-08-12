"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  WAITING_VERIFICATION: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  WAITING_PAYMENT: "Menunggu Pembayaran",
  PAYMENT_VERIFIED: "Pembayaran Terverifikasi",
  ACCEPTED: "Diterima",
  CLASS_PLACEMENT: "Penempatan Kelas",
  ACTIVE_STUDENT: "Siswa Aktif",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  ACTIVE_STUDENT: CheckCircle,
  REJECTED: XCircle,
  CANCELLED: XCircle,
  ACCEPTED: CheckCircle,
  PAYMENT_VERIFIED: CheckCircle,
  VERIFIED: CheckCircle,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  WAITING_VERIFICATION: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-cyan-100 text-cyan-700",
  WAITING_PAYMENT: "bg-orange-100 text-orange-700",
  PAYMENT_VERIFIED: "bg-teal-100 text-teal-700",
  ACCEPTED: "bg-green-100 text-green-700",
  CLASS_PLACEMENT: "bg-indigo-100 text-indigo-700",
  ACTIVE_STUDENT: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export function StatusChecker() {
  const [registrationNo, setRegistrationNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    fullName: string;
    status: string;
    program?: { name: string };
    branch?: { name: string };
    rejectionReason?: string | null;
    adminNote?: string | null;
    createdAt: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function check() {
    if (!registrationNo.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/ppdb/status/${registrationNo.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Tidak ditemukan");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setLoading(false);
  }

  if (result) {
    const Icon = STATUS_ICONS[result.status] || Clock;
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${STATUS_COLORS[result.status] || "bg-gray-100"}`}>
            <Icon className="w-7 h-7" />
          </div>
          <h2 className="font-bold text-lg text-gray-900">{result.fullName}</h2>
          <p className="text-sm text-gray-500">{registrationNo.toUpperCase()}</p>
        </div>

        <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[result.status]}`}>
              {STATUS_LABELS[result.status] || result.status}
            </span>
          </div>
          {result.program && (
            <div className="flex justify-between">
              <span className="text-gray-500">Program</span>
              <span className="font-medium text-gray-900">{result.program.name}</span>
            </div>
          )}
          {result.branch && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cabang</span>
              <span className="font-medium text-gray-900">{result.branch.name}</span>
            </div>
          )}
          {result.rejectionReason && (
            <div className="bg-red-50 rounded-lg p-3 text-red-700 text-xs">
              <p className="font-medium mb-1">Alasan Penolakan:</p>
              <p>{result.rejectionReason}</p>
            </div>
          )}
          {result.adminNote && (
            <div className="bg-blue-50 rounded-lg p-3 text-blue-700 text-xs">
              <p className="font-medium mb-1">Catatan Admin:</p>
              <p>{result.adminNote}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => { setResult(null); setRegistrationNo(""); }}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cek Nomor Lain
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Pendaftaran</label>
        <input
          value={registrationNo}
          onChange={(e) => setRegistrationNo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          placeholder="WW-2026-000001"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
      )}
      <button
        onClick={check}
        disabled={loading || !registrationNo.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Cek Status
      </button>
    </div>
  );
}
