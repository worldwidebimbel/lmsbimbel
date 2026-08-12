"use client";

import { useState } from "react";
import { Copy, TrendingUp, Users, DollarSign, Clock, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  affiliate: {
    id: string; code: string; name: string; clickCount: number; isActive: boolean;
    bankName: string | null; bankAccount: string | null; bankHolder: string | null;
  };
  stats: {
    clickCount: number;
    prospectiveStudents: number;
    registeredStudents: number;
    successfulStudents: number;
    totalCommission: number;
    pendingCommission: number;
    readyPayout: number;
    paidCommission: number;
  };
  referrals: Array<{
    id: string; status: string; fraudFlag: boolean; createdAt: string;
    registration: { registrationNo: string; fullName: string; status: string } | null;
    program: { name: string } | null;
  }>;
  payouts: Array<{
    id: string; amount: number; status: string; requestedAt: string;
    paidAt: string | null; proofUrl: string | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  REGISTRATION_VERIFIED: "Verifikasi Registrasi",
  PAYMENT_VERIFIED: "Verifikasi Pembayaran",
  VALID: "Valid",
  READY_PAYOUT: "Siap Cair",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REGISTRATION_VERIFIED: "bg-blue-100 text-blue-700",
  PAYMENT_VERIFIED: "bg-blue-100 text-blue-700",
  VALID: "bg-green-100 text-green-700",
  READY_PAYOUT: "bg-emerald-100 text-emerald-700",
  PAID: "bg-green-600 text-white",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYOUT_LABELS: Record<string, string> = {
  REQUESTED: "Diajukan",
  APPROVED: "Disetujui",
  PAID: "Dibayar",
  REJECTED: "Ditolak",
};

export function AffiliateDashboard({ affiliate, stats, referrals, payouts }: Props) {
  const [copied, setCopied] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/api/ref/${affiliate.code}`;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitPayout() {
    setPayoutLoading(true);
    setPayoutError("");
    setPayoutSuccess(false);
    try {
      const res = await fetch("/api/afiliator/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(payoutAmount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSuccess(true);
        setPayoutAmount("");
        setShowPayoutForm(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setPayoutError(data.error || "Gagal mengajukan pencairan");
      }
    } catch {
      setPayoutError("Terjadi kesalahan");
    }
    setPayoutLoading(false);
  }

  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Link Referral Anda</h3>
        <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
          <code className="flex-1 text-sm truncate">{referralLink}</code>
          <button onClick={copyLink} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-1">
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Tersalin" : "Copy"}
          </button>
        </div>
        <p className="text-sm text-blue-100 mt-2">Kode: <span className="font-bold">{affiliate.code}</span></p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<MousePointerIcon />} label="Total Klik" value={stats.clickCount.toString()} color="bg-blue-50 text-blue-600" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Calon Siswa" value={stats.prospectiveStudents.toString()} color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Pendaftar" value={stats.registeredStudents.toString()} color="bg-purple-50 text-purple-600" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Siswa Aktif" value={stats.successfulStudents.toString()} color="bg-green-50 text-green-600" />
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Komisi" value={fmt(stats.totalCommission)} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Komisi Pending" value={fmt(stats.pendingCommission)} color="bg-yellow-50 text-yellow-600" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Siap Cair" value={fmt(stats.readyPayout)} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Dibayar" value={fmt(stats.paidCommission)} color="bg-green-50 text-green-600" />
      </div>

      {/* Payout Request */}
      {stats.readyPayout > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Ajukan Pencairan</h3>
            <button
              onClick={() => setShowPayoutForm(!showPayoutForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {showPayoutForm ? "Batal" : "Ajukan"}
            </button>
          </div>
          {showPayoutForm && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Komisi siap cair: <span className="font-bold text-emerald-600">{fmt(stats.readyPayout)}</span></p>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Nominal pencairan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              {payoutError && <p className="text-sm text-red-600">{payoutError}</p>}
              {payoutSuccess && <p className="text-sm text-green-600">Pencairan berhasil diajukan! Halaman akan dimuat ulang...</p>}
              <button
                onClick={submitPayout}
                disabled={payoutLoading || !payoutAmount}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {payoutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Kirim Pengajuan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Referral History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Riwayat Referral</h3>
        </div>
        {referrals.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">Belum ada referral.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Calon Siswa</th>
                  <th className="text-left px-4 py-2 font-medium">Program</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.registration?.fullName || "-"}</td>
                    <td className="px-4 py-3">{r.program?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                      {r.fraudFlag && <span className="ml-1 text-xs text-red-600">⚠</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Riwayat Pencairan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Nominal</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Tanggal Ajukan</th>
                  <th className="text-left px-4 py-2 font-medium">Tanggal Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{fmt(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {PAYOUT_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.requestedAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function MousePointerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2z" />
    </svg>
  );
}
