"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Period = {
  id: string;
  name: string;
  academicYearId: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count?: { raports: number; payrolls: number };
  academicYear?: { name: string } | null;
};

export default function ReportPeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: true });

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/report-periods");
    if (res.ok) setPeriods(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", startDate: "", endDate: "", isActive: true });
    setOpen(true);
  }

  function openEdit(p: Period) {
    setEditing(p);
    setForm({
      name: p.name,
      startDate: p.startDate.slice(0, 10),
      endDate: p.endDate.slice(0, 10),
      isActive: p.isActive,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      ...(editing && { id: editing.id }),
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    };

    const res = await fetch("/api/admin/report-periods", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setOpen(false);
      fetchPeriods();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus periode ini?")) return;
    await fetch(`/api/admin/report-periods?id=${id}`, { method: "DELETE" });
    fetchPeriods();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Periode Rapor</h1>
          <p className="text-sm text-gray-500">Kelola periode rapor (semester/bulan)</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="h-4 w-4" /> Periode Baru
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-gray-500">Memuat...</p>
        ) : periods.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            Belum ada periode rapor.
          </div>
        ) : (
          periods.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(p.startDate).toLocaleDateString("id-ID")} - {new Date(p.endDate).toLocaleDateString("id-ID")}
                    {p.academicYear && ` · ${p.academicYear.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                  {p._count && p._count.raports > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                      {p._count.raports} rapor
                    </span>
                  )}
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">{editing ? "Edit Periode" : "Periode Baru"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Periode</label>
                  <input
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Semester 1 2026/2027"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm">Periode Aktif</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">{editing ? "Simpan" : "Buat"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
