"use client";

import { useState } from "react";
import { Ban, Loader2, FileDown } from "lucide-react";

interface Referral {
  id: string; status: string; fraudFlag: boolean; fraudReason: string | null;
  createdAt: string;
  affiliate: { code: string; name: string };
  registration: { registrationNo: string; fullName: string; status: string } | null;
  program: { name: string } | null;
  commissionAmount: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", REGISTRATION_VERIFIED: "Verifikasi Reg.", PAYMENT_VERIFIED: "Verifikasi Bayar",
  VALID: "Valid", READY_PAYOUT: "Siap Cair", PAID: "Dibayar", CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700", REGISTRATION_VERIFIED: "bg-blue-100 text-blue-700",
  PAYMENT_VERIFIED: "bg-blue-100 text-blue-700", VALID: "bg-green-100 text-green-700",
  READY_PAYOUT: "bg-emerald-100 text-emerald-700", PAID: "bg-green-600 text-white",
  CANCELLED: "bg-red-100 text-red-700",
};

export function AffiliateReferrals({ referrals }: { referrals: Referral[] }) {
  const [filter, setFilter] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const filtered = filter ? referrals.filter((r) => r.status === filter) : referrals;

  async function cancelReferral(id: string) {
    const reason = prompt("Alasan pembatalan?");
    if (!reason) return;
    setCancelling(id);
    try {
      await fetch("/api/admin/affiliate/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId: id, reason }),
      });
      window.location.reload();
    } catch {}
    setCancelling(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("")} className={`px-3 py-1.5 text-sm rounded-lg ${filter === "" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Semua</button>
        {Object.keys(STATUS_LABELS).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-sm rounded-lg ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
        <a
          href={`/api/admin/affiliate/referrals/export${filter ? `?status=${filter}` : ""}`}
          className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <FileDown className="h-4 w-4" /> Export Excel
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Afiliator</th>
                <th className="text-left px-4 py-2 font-medium">Calon Siswa</th>
                <th className="text-left px-4 py-2 font-medium">Program</th>
                <th className="text-left px-4 py-2 font-medium">Komisi</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.affiliate.name}</p>
                    <p className="text-xs text-gray-500">{r.affiliate.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    {r.registration ? (
                      <>
                        <p className="text-gray-900">{r.registration.fullName}</p>
                        <p className="text-xs text-gray-500">{r.registration.registrationNo}</p>
                      </>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.program?.name || "-"}</td>
                  <td className="px-4 py-3 font-medium">Rp {r.commissionAmount.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                    {r.fraudFlag && <span className="ml-1 text-xs text-red-600" title={r.fraudReason || ""}>⚠</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "CANCELLED" && r.status !== "PAID" && (
                      <button
                        onClick={() => cancelReferral(r.id)}
                        disabled={cancelling === r.id}
                        className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Batalkan referral"
                      >
                        {cancelling === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">Tidak ada referral.</p>}
      </div>
    </div>
  );
}
