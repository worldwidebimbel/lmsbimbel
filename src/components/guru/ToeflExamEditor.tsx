"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, Loader2, Layers, FileText, Volume2, Save } from "lucide-react";

interface Section {
  id: string;
  name: string;
  duration: number;
  order: number;
  questions: { id: string; content: string; type: string }[];
}

interface Group {
  id: string;
  type: "AUDIO" | "READING";
  title: string | null;
  passageText: string | null;
  audioUrl: string | null;
  maxPlayCount: number | null;
  timeLimit: number | null;
  order: number;
  questions: { id: string; content: string; type: string }[];
}

export default function ToeflExamEditor({ examId }: { examId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<null | "SECTION" | "GROUP">(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/guru/ujian/toefl?examId=${examId}`);
    const data = await res.json();
    setSections(data.sections ?? []);
    setGroups(data.groups ?? []);
    setLoading(false);
  }, [examId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDelete(id: string, kind: "SECTION" | "GROUP") {
    if (!confirm("Hapus item ini? Soal terkait akan kehilangan asosiasi.")) return;
    await fetch(`/api/guru/ujian/toefl/${id}?kind=${kind}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">TOEFL Sections & Groups</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd("SECTION")}
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            <Layers className="h-3.5 w-3.5" /> Add Section
          </button>
          <button
            onClick={() => setShowAdd("GROUP")}
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add Group
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sections */}
          {sections.map((s) => (
            <div key={s.id} className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-500">{s.duration} menit</span>
                <span className="ml-auto text-xs text-gray-400">{s.questions.length} soal</span>
                <button onClick={() => handleDelete(s.id, "SECTION")} className="rounded p-1 hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}

          {/* Groups */}
          {groups.map((g) => (
            <div key={g.id} className="rounded-xl border border-purple-200 bg-purple-50/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                {g.type === "AUDIO" ? <Volume2 className="h-4 w-4 text-purple-600" /> : <FileText className="h-4 w-4 text-purple-600" />}
                <span className="font-medium text-sm text-gray-800">{g.title ?? `Group ${g.type}`}</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{g.type}</span>
                {g.maxPlayCount && <span className="text-xs text-gray-500">max {g.maxPlayCount}x putar</span>}
                <span className="ml-auto text-xs text-gray-400">{g.questions.length} soal</span>
                <button onClick={() => handleDelete(g.id, "GROUP")} className="rounded p-1 hover:bg-red-100">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
              {g.passageText && (
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">{g.passageText}</p>
              )}
              {g.audioUrl && (
                <p className="text-xs text-purple-600 mt-1">Audio: {g.audioUrl}</p>
              )}
            </div>
          ))}

          {sections.length === 0 && groups.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-gray-400">Belum ada section atau group. Tambahkan untuk ujian TOEFL.</p>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddModal
          kind={showAdd}
          examId={examId}
          onClose={() => setShowAdd(null)}
          onSaved={() => { setShowAdd(null); loadData(); }}
        />
      )}
    </div>
  );
}

function AddModal({ kind, examId, onClose, onSaved }: {
  kind: "SECTION" | "GROUP";
  examId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    name: "", duration: "30", order: "0",
    type: "READING", title: "", passageText: "", audioUrl: "",
    maxPlayCount: "", timeLimit: "",
  });

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, unknown> = { examId, kind, order: Number(form.order) };
    if (kind === "SECTION") {
      payload.name = form.name;
      payload.duration = Number(form.duration);
    } else {
      payload.type = form.type;
      payload.title = form.title || null;
      payload.passageText = form.passageText || null;
      payload.audioUrl = form.audioUrl || null;
      payload.maxPlayCount = form.maxPlayCount ? Number(form.maxPlayCount) : null;
      payload.timeLimit = form.timeLimit ? Number(form.timeLimit) : null;
    }

    const res = await fetch("/api/guru/ujian/toefl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">{kind === "SECTION" ? "Tambah Section" : "Tambah Question Group"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>

        {kind === "SECTION" ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nama Section *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Listening, Structure, Reading..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Durasi (menit) *</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipe *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="READING">Reading (Passage)</option>
                <option value="AUDIO">Audio (Listening)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Judul</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            {form.type === "READING" ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Passage Text</label>
                <textarea value={form.passageText} onChange={(e) => setForm({ ...form, passageText: e.target.value })} rows={5} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none" />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Audio URL</label>
                <input value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="Cloudinary URL..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Max Play Count</label>
                <input type="number" value={form.maxPlayCount} onChange={(e) => setForm({ ...form, maxPlayCount: e.target.value })} placeholder="Opsional" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Time Limit (detik)</label>
                <input type="number" value={form.timeLimit} onChange={(e) => setForm({ ...form, timeLimit: e.target.value })} placeholder="Opsional" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Urutan</label>
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (kind === "SECTION" && !form.name)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </button>
      </div>
    </div>
  );
}
