"use client";

import { useState } from "react";
import { Check, X, DollarSign, Loader2, Upload } from "lucide-react";

interface Payout {
  id: string; amount: number; status: string;
  requestedAt: string; paidAt: string | null; proofUrl: string | null;
  commissionCount: number;
  affiliate: {
    code: string; name: string;
    bankName: string | null; bankAccount: string | null; bankHolder: string | null;
  };
}

const PAYOUT_LABELS: Record<string, string> = {
  REQUESTED: "Diajukan", APPROVED: "Disetujui", PAID: "Dibayar", REJECTED: "Ditolak",
};

const PAYOUT_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-700", APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-600 text-white", REJECTED: "bg-red-100 text-red-700",
};

export function AffiliatePayouts({ payouts }: { payouts: Payout[] }) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function doAction(payoutId: string, action: string, proofUrl?: string) {
    setActionLoading(payoutId);
    try {
      await fetch("/api/admin/affiliate/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action, proofUrl }),
      });
      window.location.reload();
    } catch {}
    setActionLoading(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Afiliator</th>
              <th className="text-left px-4 py-2 font-medium">Nominal</th>
              <th className="text-left px-4 py-2 font-medium">Bank</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Tanggal</th>
              <th className="text-right px-4 py-2 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.affiliate.name}</p>
                  <p className="text-xs text-gray-500">{p.affiliate.code}</p>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">Rp {p.amount.toLocaleString("id-ID")}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.affiliate.bankName ? (
                    <>
                      <p>{p.affiliate.bankName}</p>
                      <p className="text-xs">{p.affiliate.bankAccount} ({p.affiliate.bankHolder})</p>
                    </>
                  ) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYOUT_COLORS[p.status] || "bg-gray-100"}`}>
                    {PAYOUT_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <p>{new Date(p.requestedAt).toLocaleDateString("id-ID")}</p>
                  {p.paidAt && <p className="text-xs text-green-600">Dibayar: {new Date(p.paidAt).toLocaleDateString("id-ID")}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === "REQUESTED" && (
                      <>
                        <button
                          onClick={() => doAction(p.id, "approve")}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Setujui"
                        >
                          {actionLoading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => doAction(p.id, "reject")}
                          disabled={actionLoading === p.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Tolak"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {p.status === "APPROVED" && (
                      <button
                        onClick={() => doAction(p.id, "pay", p.proofUrl || undefined)}
                        disabled={actionLoading === p.id}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50"
                        title="Tandai dibayar"
                      >
                        {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                        Bayar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payouts.length === 0 && <p className="p-6 text-center text-gray-500 text-sm">Belum ada pengajuan pencairan.</p>}
    </div>
  );
}
