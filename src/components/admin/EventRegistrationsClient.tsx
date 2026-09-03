"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserCheck, Medal, Loader2, Check } from "lucide-react";

interface Registration {
  id: string;
  status: string;
  paymentStatus: string;
  price: number;
  paymentMethod: string | null;
  paidAt: string | null;
  registeredAt: string;
  score: number | null;
  rank: number | null;
  user: { id: string; name: string; email: string };
  package: { name: string; price: number } | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Menunggu", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Dikonfirmasi", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Dibatalkan", cls: "bg-red-100 text-red-700" },
  ATTENDED: { label: "Hadir", cls: "bg-blue-100 text-blue-700" },
};

const PAY_LABELS: Record<string, { label: string; cls: string }> = {
  FREE: { label: "Gratis", cls: "bg-gray-100 text-gray-600" },
  PENDING: { label: "Belum Bayar", cls: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Lunas", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "Gagal", cls: "bg-red-100 text-red-700" },
};

export default function EventRegistrationsClient({
  eventId,
  eventTitle,
  initialRegistrations,
}: {
  eventId: string;
  eventTitle: string;
  initialRegistrations: Registration[];
}) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function updateRegistration(registrationId: string, patch: Record<string, string>) {
    setSaving(registrationId);
    setMsg("");
    const res = await fetch(`/api/admin/events/${eventId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setRegistrations((prev) => prev.map((r) => (r.id === registrationId ? { ...r, ...data } : r)));
      setMsg("Tersimpan");
    } else {
      setMsg(data.error || "Gagal menyimpan");
    }
    setSaving(null);
  }

  const confirmed = registrations.filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED").length;
  const paid = registrations.filter((r) => r.paymentStatus === "PAID" || r.paymentStatus === "FREE").length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <UserCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Peserta Event</h1>
          <p className="text-sm text-gray-500">{eventTitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Pendaftar</p>
          <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Dikonfirmasi</p>
          <p className="text-2xl font-bold text-green-700">{confirmed}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Lunas/Gratis</p>
          <p className="text-2xl font-bold text-blue-700">{paid}</p>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{msg}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Peserta</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Paket</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Bayar</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Skor / Rank</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">Belum ada peserta</td>
              </tr>
            )}
            {registrations.map((r) => {
              const st = STATUS_LABELS[r.status] ?? { label: r.status, cls: "bg-gray-100 text-gray-600" };
              const ps = PAY_LABELS[r.paymentStatus] ?? { label: r.paymentStatus, cls: "bg-gray-100 text-gray-600" };
              return (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.user.name}</p>
                    <p className="text-xs text-gray-500">{r.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.package?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ps.cls}`}>{ps.label}</span>
                    {r.paidAt && <p className="text-xs text-gray-500 mt-0.5">{new Date(r.paidAt).toLocaleDateString("id-ID")}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.score !== null ? (
                      <div>
                        <span className="font-bold text-gray-900">{r.score}</span>
                        {r.rank && (
                          <span className="ml-1 text-xs text-gray-500">
                            <Medal className="inline w-3 h-3" /> #{r.rank}
                          </span>
                        )}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {r.status !== "CONFIRMED" && (
                        <button
                          onClick={() => updateRegistration(r.id, { status: "CONFIRMED" })}
                          disabled={saving === r.id}
                          title="Konfirmasi"
                          className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                        >
                          {saving === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {r.paymentStatus === "PENDING" && (
                        <button
                          onClick={() => updateRegistration(r.id, { paymentStatus: "PAID" })}
                          disabled={saving === r.id}
                          title="Tandai Lunas"
                          className="text-xs px-2 py-0.5 border border-green-300 text-green-600 hover:bg-green-50 rounded"
                        >
                          Lunas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
