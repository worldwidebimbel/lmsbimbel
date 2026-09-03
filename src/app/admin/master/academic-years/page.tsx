"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Trash2, Edit, Check, X } from "lucide-react";

type AcademicYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
};

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isActive: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchYears = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/academic-years");
    if (res.ok) {
      const data = await res.json();
      setYears(data.map((y: AcademicYear) => ({
        ...y,
        startDate: y.startDate ? new Date(y.startDate).toISOString().slice(0, 10) : "",
        endDate: y.endDate ? new Date(y.endDate).toISOString().slice(0, 10) : "",
        createdAt: y.createdAt ? new Date(y.createdAt).toISOString() : "",
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchYears(); }, [fetchYears]);

  const resetForm = () => {
    setForm({ name: "", startDate: "", endDate: "", isActive: false });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError("Nama, tanggal mulai, dan tanggal selesai wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editingId
        ? `/api/admin/academic-years/${editingId}`
        : "/api/admin/academic-years";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan");
        setSaving(false);
        return;
      }
      resetForm();
      fetchYears();
    } catch {
      setError("Terjadi kesalahan");
    }
    setSaving(false);
  };

  const handleEdit = (y: AcademicYear) => {
    setForm({
      name: y.name,
      startDate: y.startDate,
      endDate: y.endDate,
      isActive: y.isActive,
    });
    setEditingId(y.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tahun ajaran ini?")) return;
    const res = await fetch(`/api/admin/academic-years/${id}`, { method: "DELETE" });
    if (res.ok) fetchYears();
  };

  const handleToggleActive = async (y: AcademicYear) => {
    const res = await fetch(`/api/admin/academic-years/${y.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !y.isActive }),
    });
    if (res.ok) fetchYears();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tahun Ajaran</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola tahun ajaran untuk kelas dan rapor</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Tambah Tahun Ajaran
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tahun Ajaran</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="contoh: 2025/2026 Ganjil"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                Set sebagai aktif
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat...</div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Belum ada tahun ajaran</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Mulai</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Selesai</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {years.map((y) => (
                <tr key={y.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{y.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{y.startDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{y.endDate}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(y)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        y.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {y.isActive ? (<><Check className="w-3 h-3" /> Aktif</>) : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(y)}
                        title="Edit"
                        className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(y.id)}
                        title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
