"use client";

import { useState } from "react";
import { Plus, Trash2, X, Calendar, Clock, Users, FileText, CheckCircle, Edit3, NotebookPen } from "lucide-react";

interface ClassItem {
  id: string;
  name: string;
  subject: { name: string };
  schedules: { id: string; dayOfWeek: string; startTime: string; endTime: string }[];
}

interface Journal {
  id: string;
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  material: string | null;
  activity: string;
  obstacles: string | null;
  solution: string | null;
  studentCount: number;
  status: string;
  class: { id: string; name: string; subject: { name: string } };
}

const DAY_LABELS: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu", KAMIS: "Kamis",
  JUMAT: "Jumat", SABTU: "Sabtu", MINGGU: "Minggu",
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  SUBMITTED: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
  APPROVED: { label: "Approved", cls: "bg-green-100 text-green-700" },
};

export default function JurnalMengajarClient({
  classes,
  initialJournals,
}: {
  classes: ClassItem[];
  initialJournals: Journal[];
}) {
  const [journals, setJournals] = useState(initialJournals);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState("");

  const blankForm = {
    classId: "",
    scheduleId: "",
    sessionDate: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:30",
    material: "",
    activity: "",
    obstacles: "",
    solution: "",
    studentCount: 0,
    status: "DRAFT" as string,
  };
  const [form, setForm] = useState(blankForm);

  const filtered = filterClass ? journals.filter((j) => j.classId === filterClass) : journals;

  function resetForm() {
    setForm(blankForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!form.classId || !form.activity) return;

    const payload = {
      classId: form.classId,
      scheduleId: form.scheduleId || null,
      sessionDate: form.sessionDate,
      startTime: form.startTime,
      endTime: form.endTime,
      material: form.material || null,
      activity: form.activity,
      obstacles: form.obstacles || null,
      solution: form.solution || null,
      studentCount: form.studentCount,
      status: form.status,
    };

    if (editingId) {
      const res = await fetch(`/api/guru/jurnal/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setJournals((prev) => prev.map((j) => (j.id === editingId ? updated : j)));
        resetForm();
      }
    } else {
      const res = await fetch("/api/guru/jurnal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setJournals((prev) => [created, ...prev]);
        resetForm();
      }
    }
  }

  function handleEdit(j: Journal) {
    setEditingId(j.id);
    setForm({
      classId: j.classId,
      scheduleId: "",
      sessionDate: new Date(j.sessionDate).toISOString().split("T")[0],
      startTime: j.startTime,
      endTime: j.endTime,
      material: j.material ?? "",
      activity: j.activity,
      obstacles: j.obstacles ?? "",
      solution: j.solution ?? "",
      studentCount: j.studentCount,
      status: j.status,
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/guru/jurnal/${id}`, { method: "DELETE" });
    if (res.ok) setJournals((prev) => prev.filter((j) => j.id !== id));
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/guru/jurnal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJournals((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  }

  const selectedClass = classes.find((c) => c.id === form.classId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditingId(null); setForm(blankForm); setShowForm(true); }}
          className="ml-auto flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Buat Jurnal
        </button>
      </div>

      {/* Journal List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <NotebookPen className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Belum ada jurnal mengajar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => (
            <div key={j.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {j.class.name}
                    </span>
                    <span className="text-xs text-gray-500">{j.class.subject.name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[j.status]?.cls ?? STATUS_LABELS.DRAFT.cls}`}>
                      {STATUS_LABELS[j.status]?.label ?? j.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(j.sessionDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {j.startTime} - {j.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {j.studentCount} siswa
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{j.activity}</p>
                  {j.material && (
                    <p className="mt-1 text-xs text-gray-500">📚 {j.material}</p>
                  )}
                  {j.obstacles && (
                    <p className="mt-1 text-xs text-orange-600">⚠ {j.obstacles}</p>
                  )}
                  {j.solution && (
                    <p className="mt-0.5 text-xs text-green-600">✓ {j.solution}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {j.status === "DRAFT" && (
                    <button
                      onClick={() => handleStatusChange(j.id, "SUBMITTED")}
                      className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500"
                      title="Submit"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(j)}
                    className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Jurnal" : "Buat Jurnal Mengajar"}
              </h2>
              <button onClick={resetForm} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kelas *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">— Pilih Kelas —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.subject.name})</option>
                ))}
              </select>
            </div>

            {selectedClass && selectedClass.schedules.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Jadwal (opsional)</label>
                <select
                  value={form.scheduleId}
                  onChange={(e) => {
                    const sched = selectedClass.schedules.find((s) => s.id === e.target.value);
                    if (sched) {
                      setForm({ ...form, scheduleId: e.target.value, startTime: sched.startTime, endTime: sched.endTime });
                    } else {
                      setForm({ ...form, scheduleId: "" });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">— Manual —</option>
                  {selectedClass.schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek} {s.startTime}-{s.endTime}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal *</label>
                <input
                  type="date"
                  value={form.sessionDate}
                  onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mulai *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Selesai *</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Materi (opsional)</label>
              <input
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="Contoh: Bab 3 - Turunan"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kegiatan *</label>
              <textarea
                value={form.activity}
                onChange={(e) => setForm({ ...form, activity: e.target.value })}
                rows={3}
                placeholder="Jelaskan kegiatan mengajar..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kendala (opsional)</label>
              <textarea
                value={form.obstacles}
                onChange={(e) => setForm({ ...form, obstacles: e.target.value })}
                rows={2}
                placeholder="Ada kendala?"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Solusi (opsional)</label>
              <textarea
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
                rows={2}
                placeholder="Bagaimana solusinya?"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Jumlah Siswa</label>
                <input
                  type="number"
                  value={form.studentCount}
                  onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })}
                  min={0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.classId || !form.activity}
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {editingId ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
