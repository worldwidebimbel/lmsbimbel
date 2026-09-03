"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Trash2, Loader2, CalendarDays, AlertTriangle } from "lucide-react";

interface Schedule {
  id: string; dayOfWeek: string; startTime: string; endTime: string;
  roomId: string | null; roomRel: { id: string; name: string } | null;
}

interface Room {
  id: string; name: string; roomNumber: string | null; capacity: number;
}

const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
const DAY_LABEL: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu", KAMIS: "Kamis",
  JUMAT: "Jumat", SABTU: "Sabtu", MINGGU: "Minggu",
};
const DAY_COLOR: Record<string, string> = {
  SENIN: "bg-blue-100 text-blue-700", SELASA: "bg-purple-100 text-purple-700",
  RABU: "bg-green-100 text-green-700", KAMIS: "bg-yellow-100 text-yellow-700",
  JUMAT: "bg-orange-100 text-orange-700", SABTU: "bg-pink-100 text-pink-700",
  MINGGU: "bg-red-100 text-red-700",
};

export default function ScheduleManagerClient({
  classId, rooms, initialSchedules,
}: { classId: string; rooms: Room[]; initialSchedules: Schedule[] }) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ dayOfWeek: "SENIN", startTime: "08:00", endTime: "09:30", roomId: "" });

  const localConflicts = useMemo(() => {
    if (!showForm) return [];
    return schedules.filter((s) => {
      if (s.dayOfWeek !== form.dayOfWeek) return false;
      return form.startTime < s.endTime && s.startTime < form.endTime;
    });
  }, [schedules, form, showForm]);

  const hasTimeError = form.startTime >= form.endTime;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setError("");
    startTransition(async () => {
      const res = await fetch(`/api/admin/classes/${classId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, roomId: form.roomId || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        if (res.status === 409 && d.conflicts) {
          setError(d.conflicts.map((c: { message: string }) => c.message).join("\n"));
        } else {
          setError(d.error ?? "Gagal");
        }
        return;
      }
      const s: Schedule = await res.json();
      setSchedules((prev) => [...prev, s].sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)));
      setShowForm(false);
      setForm({ dayOfWeek: "SENIN", startTime: "08:00", endTime: "09:30", roomId: "" });
    });
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    const res = await fetch(`/api/admin/classes/${classId}/schedules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId }),
    });
    if (res.ok) setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  }

  return (
    <div className="space-y-4">
      {schedules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-14">
          <CalendarDays className="h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Belum ada jadwal. Tambahkan jadwal pertama.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {schedules.length > 0 && (
            <div className="divide-y divide-gray-100">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DAY_COLOR[s.dayOfWeek] ?? "bg-gray-100 text-gray-600"}`}>
                      {DAY_LABEL[s.dayOfWeek]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{s.startTime} – {s.endTime}</span>
                    {s.roomRel && <span className="text-xs text-gray-400">📍 {s.roomRel.name}</span>}
                  </div>
                  <button onClick={() => handleDelete(s.id)}
                    title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Tambah Jadwal</h3>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
          {hasTimeError && (
            <p className="text-sm text-red-500">Jam selesai harus setelah jam mulai.</p>
          )}
          {localConflicts.length > 0 && !hasTimeError && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Bentrok dengan jadwal existing di kelas ini:</p>
                  <ul className="mt-1 list-disc list-inside">
                    {localConflicts.map((c) => (
                      <li key={c.id}>{DAY_LABEL[c.dayOfWeek]} {c.startTime}–{c.endTime}{c.roomRel ? ` (${c.roomRel.name})` : ""}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Hari</label>
            <select value={form.dayOfWeek} onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              {DAYS.map((d) => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Jam Mulai</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Jam Selesai</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Ruangan (opsional)</label>
            <select value={form.roomId} onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">— Tanpa ruangan —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.roomNumber ? ` (${r.roomNumber})` : ""} · kap. {r.capacity}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={isPending || hasTimeError}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Jadwal
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
          <Plus className="h-4 w-4" /> Tambah Jadwal
        </button>
      )}
    </div>
  );
}
