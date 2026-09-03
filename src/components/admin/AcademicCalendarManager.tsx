"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Loader2, X, CalendarDays } from "lucide-react";
import AcademicCalendar from "@/components/shared/AcademicCalendar";

const TYPES = [
  { value: "LIBURAN", label: "Liburan", color: "#10b981" },
  { value: "UJIAN", label: "Ujian", color: "#ef4444" },
  { value: "TRYOUT", label: "Tryout", color: "#f59e0b" },
  { value: "RAPAT", label: "Rapat", color: "#8b5cf6" },
  { value: "EVENT", label: "Event", color: "#3b82f6" },
  { value: "PENTING", label: "Penting", color: "#ec4899" },
  { value: "LAINNYA", label: "Lainnya", color: "#6b7280" },
];

interface Branch { id: string; name: string }

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  color: string | null;
  branchId: string | null;
  isActive: boolean;
}

export default function AcademicCalendarManager({ branches }: { branches: Branch[] }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", type: "LAINNYA", startDate: "", endDate: "",
    isAllDay: true, color: "#3b82f6", branchId: "", isActive: true,
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/academic-calendar");
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({
      title: "", description: "", type: "LAINNYA", startDate: "", endDate: "",
      isAllDay: true, color: "#3b82f6", branchId: "", isActive: true,
    });
    setEditing(null);
  }

  function startEdit(e: CalendarEvent) {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description ?? "",
      type: e.type,
      startDate: e.startDate.slice(0, 16),
      endDate: e.endDate ? e.endDate.slice(0, 16) : "",
      isAllDay: e.isAllDay,
      color: e.color ?? TYPES.find((t) => t.value === e.type)?.color ?? "#3b82f6",
      branchId: e.branchId ?? "",
      isActive: e.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.startDate) {
      toast.error("Judul dan tanggal mulai wajib diisi");
      return;
    }
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      title: form.title,
      description: form.description || null,
      type: form.type,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      isAllDay: form.isAllDay,
      color: form.color,
      branchId: form.branchId || null,
      isActive: form.isActive,
    };

    const res = await fetch("/api/admin/academic-calendar", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { toast.error("Gagal menyimpan acara"); return; }
    toast.success(editing ? "Acara diperbarui" : "Acara ditambahkan");
    resetForm();
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus acara ini?")) return;
    const res = await fetch("/api/admin/academic-calendar", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Gagal menghapus acara"); return; }
    toast.success("Acara dihapus");
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Tampilan Kalender</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Tambah Acara
          </button>
        </div>
        <AcademicCalendar apiUrl="/api/calendar" readOnly />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Daftar Acara</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-h-[600px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Belum ada acara akademik</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((e) => (
                <div key={e.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-1 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: e.color || TYPES.find((t) => t.value === e.type)?.color }} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{e.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(e.startDate).toLocaleDateString("id-ID")}
                          {e.endDate && ` — ${new Date(e.endDate).toLocaleDateString("id-ID")}`}
                        </p>
                        <p className="text-xs text-gray-400">{TYPES.find((t) => t.value === e.type)?.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(e)} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setShowForm(false); resetForm(); }}>
          <form onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? "Edit Acara" : "Tambah Acara"}</h3>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Judul</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" required />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipe</label>
                <select value={form.type} onChange={(e) => {
                  const type = e.target.value;
                  setForm((p) => ({ ...p, type, color: TYPES.find((t) => t.value === type)?.color ?? p.color }));
                }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Warna</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-0.5" />
                  <span className="text-xs text-gray-500">{form.color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mulai</label>
                <input type={form.isAllDay ? "date" : "datetime-local"} value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Selesai (opsional)</label>
                <input type={form.isAllDay ? "date" : "datetime-local"} value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isAllDay}
                  onChange={(e) => setForm((p) => ({ ...p, isAllDay: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Seharian
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Aktif
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cabang (opsional)</label>
              <select value={form.branchId} onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">Semua cabang</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {editing ? "Simpan Perubahan" : "Tambah Acara"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
