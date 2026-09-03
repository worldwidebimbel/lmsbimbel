"use client";

import { useState } from "react";
import { Plus, X, ExternalLink, Trash2, Loader2, Video, Clock, Calendar, Link2, Pencil } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

interface ClassItem { id: string; name: string }
interface LiveSession {
  id: string; title: string; description: string | null;
  startTime: string; endTime: string | null;
  meetingUrl: string | null; platform: string; isActive: boolean;
  recordingUrl: string | null;
  class: { id: string; name: string };
}

const PLATFORMS = ["Google Meet", "Zoom", "Microsoft Teams", "YouTube Live", "Lainnya"];

const statusOf = (s: LiveSession) => {
  const start = new Date(s.startTime);
  const end = s.endTime ? new Date(s.endTime) : null;
  const now = new Date();
  if (end && isPast(end)) return { label: "Selesai", cls: "bg-gray-100 text-gray-600" };
  if (isPast(start) && (!end || !isPast(end))) return { label: "Sedang Live", cls: "bg-red-100 text-red-700 animate-pulse" };
  if (isToday(start)) return { label: "Hari Ini", cls: "bg-amber-100 text-amber-700" };
  return { label: "Dijadwalkan", cls: "bg-blue-100 text-blue-700" };
};

interface Props { classes: ClassItem[]; initialSessions: LiveSession[] }

export default function LiveSessionGuruClient({ classes, initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSession | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ classId: classes[0]?.id ?? "", title: "", description: "", startTime: "", endTime: "", meetingUrl: "", platform: "Google Meet", recordingUrl: "" });

  function openCreate() {
    setEditingSession(null);
    setForm({ classId: classes[0]?.id ?? "", title: "", description: "", startTime: "", endTime: "", meetingUrl: "", platform: "Google Meet", recordingUrl: "" });
    setShowForm(true);
  }

  function openEdit(s: LiveSession) {
    setEditingSession(s);
    setForm({
      classId: s.class.id, title: s.title, description: s.description ?? "",
      startTime: s.startTime.slice(0, 16), endTime: s.endTime?.slice(0, 16) ?? "",
      meetingUrl: s.meetingUrl ?? "", platform: s.platform, recordingUrl: s.recordingUrl ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.classId || !form.title.trim() || !form.startTime) {
      toast.error("Kelas, judul, dan waktu mulai wajib diisi"); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, description: form.description || null, endTime: form.endTime || null, meetingUrl: form.meetingUrl || null, recordingUrl: form.recordingUrl || null };
      if (editingSession) {
        const res = await fetch(`/api/live/${editingSession.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
          const updated = await res.json();
          setSessions((prev) => prev.map((s) => s.id === editingSession.id ? updated : s));
          toast.success("Sesi diperbarui"); setShowForm(false);
        } else toast.error("Gagal memperbarui");
      } else {
        const res = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (res.ok) {
          const created = await res.json();
          setSessions((prev) => [...prev, created].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
          toast.success("Sesi berhasil dijadwalkan"); setShowForm(false);
        } else toast.error("Gagal menjadwalkan");
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus sesi ini?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/live/${id}`, { method: "DELETE" });
      if (res.ok) { setSessions((prev) => prev.filter((s) => s.id !== id)); toast.success("Sesi dihapus"); }
      else toast.error("Gagal menghapus");
    } finally { setDeleting(null); }
  }

  const upcoming = sessions.filter((s) => !s.endTime || !isPast(new Date(s.endTime)));
  const past = sessions.filter((s) => s.endTime && isPast(new Date(s.endTime)));

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">
          <Plus className="h-4 w-4" /> Jadwalkan Sesi
        </button>
      </div>

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
          <Video className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada sesi kelas online. Jadwalkan sekarang!</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Mendatang & Berlangsung</h3>
          {upcoming.map((s) => <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-500">Riwayat Sesi</h3>
          {past.map((s) => <SessionCard key={s.id} session={s} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} isPast />)}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingSession ? "Edit Sesi" : "Jadwalkan Sesi Baru"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-500 hover:text-gray-600" /></button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Kelas *</label>
                <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Judul Sesi *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Pembahasan Ujian Tengah Semester" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Waktu Mulai *</label>
                <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Waktu Selesai</label>
                <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Link Meeting</label>
                <input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Materi yang akan dibahas, persiapan yang diperlukan..." rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none" />
              </div>
              {editingSession && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Link Rekaman (setelah sesi)</label>
                  <input value={form.recordingUrl} onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                    placeholder="https://drive.google.com/..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingSession ? "Simpan Perubahan" : "Jadwalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onEdit, onDelete, deleting, isPast: past }: {
  session: LiveSession; onEdit: (s: LiveSession) => void; onDelete: (id: string) => void;
  deleting: string | null; isPast?: boolean;
}) {
  const status = statusOf(session);
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${past ? "border-gray-100 bg-gray-50/50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{session.class.name}</span>
            <span className="text-xs text-gray-500">{session.platform}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          {session.description && <p className="mt-1 text-sm text-gray-500 line-clamp-2">{session.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => onEdit(session)} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(session.id)} disabled={deleting === session.id} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500">
            {deleting === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
          {format(new Date(session.startTime), "EEEE, d MMM yyyy", { locale: localeId })}
        </span>
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
          {format(new Date(session.startTime), "HH:mm")}
          {session.endTime && ` – ${format(new Date(session.endTime), "HH:mm")}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.meetingUrl && (
          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">
            <Video className="h-3.5 w-3.5" /> Mulai / Buka Meeting
          </a>
        )}
        {session.recordingUrl && (
          <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Link2 className="h-3.5 w-3.5" /> Rekaman
          </a>
        )}
        {!session.meetingUrl && !past && (
          <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            <ExternalLink className="h-3.5 w-3.5" /> Belum ada link meeting
          </span>
        )}
      </div>
    </div>
  );
}
