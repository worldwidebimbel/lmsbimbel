"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Check, Loader2, BookMarked, Plus } from "lucide-react";

interface BankQuestion {
  id: string;
  type: string;
  content: string;
  difficulty: number;
  subject: { id: string; name: string; color: string } | null;
  subjectId: string | null;
}

interface Subject { id: string; name: string; color: string }

const TYPE_LABELS: Record<string, string> = {
  PILGAN: "Pilgan",
  PILGAN_KOMPLEK: "Kompleks",
  BENAR_SALAH: "B/S",
  MENJODOHKAN: "Jodohkan",
  MENGURUTKAN: "Urutkan",
  SETUJU_TIDAK: "Setuju",
  ESSAY: "Essay",
  ISIAN: "Isian",
};

const DIFF_LABELS: Record<number, string> = { 1: "Mudah", 2: "Sedang", 3: "Sulit" };

export default function PickFromBankModal({
  examId,
  subjects,
  onClose,
  onPicked,
}: {
  examId: string;
  subjects: Subject[];
  onClose: () => void;
  onPicked: () => void;
}) {
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSubject) params.set("subjectId", filterSubject);
    if (filterType) params.set("type", filterType);
    if (filterDifficulty) params.set("difficulty", filterDifficulty);
    if (search) params.set("search", search);

    const res = await fetch(`/api/guru/bank-soal?${params}`);
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data : (data.questions ?? []));
    setLoading(false);
  }, [filterSubject, filterType, filterDifficulty, search]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAttach() {
    if (selected.size === 0) return;
    setSaving(true);
    const res = await fetch("/api/guru/ujian/pick-from-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examId, questionIds: [...selected] }),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Gagal menambahkan soal ke ujian.");
      return;
    }
    if (!data?.created) {
      alert(data?.message ?? "Tidak ada soal baru yang ditambahkan.");
      return;
    }
    alert(`${data.created} soal berhasil ditambahkan ke ujian.`);
    onPicked();
  }

  const filtered = questions.filter((q) => {
    if (search && !q.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSubject && q.subjectId !== filterSubject) return false;
    if (filterType && q.type !== filterType) return false;
    if (filterDifficulty && String(q.difficulty) !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white my-8 flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-amber-600" />
            <h2 className="font-bold text-gray-900">Pilih Soal dari Bank</h2>
            {selected.size > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {selected.size} dipilih
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari soal..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Semua Mapel</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Semua Tipe</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Semua Level</option>
            <option value="1">Mudah</option>
            <option value="2">Sedang</option>
            <option value="3">Sulit</option>
          </select>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">Tidak ada soal di bank soal.</p>
            </div>
          ) : (
            filtered.map((q) => (
              <button
                key={q.id}
                onClick={() => toggleSelect(q.id)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                  selected.has(q.id) ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                  selected.has(q.id) ? "bg-amber-500 text-white" : "border border-gray-300"
                }`}>
                  {selected.has(q.id) && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{TYPE_LABELS[q.type] ?? q.type}</span>
                    {q.subject && <span className="text-xs text-gray-500">{q.subject.name}</span>}
                    <span className="text-xs text-gray-500">{DIFF_LABELS[q.difficulty] ?? ""}</span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.content}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 p-4">
          <span className="text-xs text-gray-500">{filtered.length} soal tersedia</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button
              onClick={handleAttach}
              disabled={selected.size === 0 || saving}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tambah {selected.size > 0 && `(${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
