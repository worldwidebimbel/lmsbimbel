"use client";

import { useState, useTransition } from "react";
import { Wallet, Plus, CheckCircle, Clock, X, FileDown } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Teacher { id: string; name: string; email: string }
interface Payroll {
  id: string;
  teacherId: string;
  periodStart: string;
  periodEnd: string;
  ratePerMeeting: number;
  ratePerHour: number;
  totalMeetings: number;
  totalHours: number;
  totalAmount: number;
  status: string;
  paidAt: string | null;
  note: string | null;
  teacher: { name: string; email: string };
  branch: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  APPROVED: "Disetujui",
  PAID: "Dibayar",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function TeacherPayrollClient({ teachers, payrolls: initial }: { teachers: Teacher[]; payrolls: Payroll[] }) {
  const [payrolls, setPayrolls] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    teacherId: "",
    periodStart: new Date().toISOString().split("T")[0],
    periodEnd: new Date().toISOString().split("T")[0],
    ratePerMeeting: 0,
    ratePerHour: 0,
  });
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!form.teacherId || !form.periodStart || !form.periodEnd) {
      toast.error("Semua field wajib diisi");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/teacher-payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Payroll dibuat");
        setShowForm(false);
        const updated = await fetch("/api/admin/teacher-payroll").then((r) => r.json());
        setPayrolls(updated);
      } else {
        toast.error("Gagal membuat payroll");
      }
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/teacher-payroll/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Status payroll diperbarui");
        const updated = await fetch("/api/admin/teacher-payroll").then((r) => r.json());
        setPayrolls(updated);
      } else {
        toast.error("Gagal memperbarui status");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payroll Tutor</h1>
            <p className="text-sm text-gray-500">Hitung dan kelola pembayaran tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/teacher-payroll/export"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" /> Export Excel
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Generate Payroll
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Generate Payroll Baru</h2>
            <button onClick={() => setShowForm(false)} title="Tutup" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutor</label>
              <select
                value={form.teacherId}
                onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Pilih tutor</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dari</label>
                <input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) => setForm((p) => ({ ...p, periodStart: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sampai</label>
                <input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) => setForm((p) => ({ ...p, periodEnd: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rate per Pertemuan (Rp)</label>
              <input
                type="number"
                value={form.ratePerMeeting}
                onChange={(e) => setForm((p) => ({ ...p, ratePerMeeting: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rate per Jam (Rp)</label>
              <input
                type="number"
                value={form.ratePerHour}
                onChange={(e) => setForm((p) => ({ ...p, ratePerHour: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Generate"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Riwayat Payroll</h2>
        </div>
        {payrolls.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada data payroll</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Tutor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">Periode</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Pertemuan</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Jam</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.teacher.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.periodStart).toLocaleDateString("id-ID")} - {new Date(p.periodEnd).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{p.totalMeetings}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{p.totalHours}h</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] ?? "bg-gray-100"}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.status === "DRAFT" && (
                        <button
                          onClick={() => handleStatusChange(p.id, "APPROVED")}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Setujui
                        </button>
                      )}
                      {p.status === "APPROVED" && (
                        <button
                          onClick={() => handleStatusChange(p.id, "PAID")}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Tandai Dibayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
