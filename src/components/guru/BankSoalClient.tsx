"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Upload, Search, BookMarked, CheckSquare } from "lucide-react";

type QuestionType = "PILGAN" | "ESSAY" | "BENAR_SALAH" | "ISIAN";

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  score: number;
  difficulty: number;
  subject: { id: string; name: string; color: string } | null;
  subjectId: string | null;
}

interface Subject { id: string; name: string; color: string }
interface Exam { id: string; title: string; class: { name: string } }

const DIFF_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Mudah", cls: "bg-green-100 text-green-700" },
  2: { label: "Sedang", cls: "bg-yellow-100 text-yellow-700" },
  3: { label: "Sulit", cls: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<QuestionType, string> = {
  PILGAN: "Pilgan", ESSAY: "Essay", BENAR_SALAH: "Benar/Salah", ISIAN: "Isian",
};

export default function BankSoalClient({ initialQuestions, subjects, exams }: {
  initialQuestions: Question[];
  subjects: Subject[];
  exams: Exam[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [targetExam, setTargetExam] = useState("");
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    subjectId: "", type: "PILGAN" as QuestionType,
    content: "", options: ["", "", "", ""], correctAnswer: "", explanation: "", score: 1, difficulty: 2,
  });

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.content.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || q.subjectId === filterSubject;
    const matchType = !filterType || q.type === filterType;
    return matchSearch && matchSubject && matchType;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  async function handleAdd() {
    const body: Record<string, unknown> = {
      subjectId: form.subjectId || null,
      type: form.type,
      content: form.content,
      correctAnswer: form.correctAnswer || null,
      explanation: form.explanation || null,
      score: form.score,
      difficulty: form.difficulty,
    };
    if (form.type === "PILGAN" || form.type === "BENAR_SALAH") {
      body.options = form.type === "BENAR_SALAH" ? ["Benar", "Salah"] : form.options.filter(Boolean);
    }
    const res = await fetch("/api/guru/bank-soal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const q = await res.json();
      setQuestions((prev) => [q, ...prev]);
      setShowAdd(false);
      setForm({ subjectId: "", type: "PILGAN", content: "", options: ["", "", "", ""], correctAnswer: "", explanation: "", score: 1, difficulty: 2 });
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/guru/bank-soal/${id}`, { method: "DELETE" });
    if (res.ok) setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleImport() {
    if (!targetExam || selected.size === 0) return;
    startTransition(async () => {
      const res = await fetch(`/api/ujian/${targetExam}/import-soal`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: [...selected] }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.imported} soal berhasil diimport ke ujian!`);
        setSelected(new Set());
        setShowImport(false);
        setTargetExam("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari soal..." className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Mapel</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              <Upload className="h-4 w-4" /> Import {selected.size} ke Ujian
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
            <Plus className="h-4 w-4" /> Tambah Soal
          </button>
        </div>
      </div>

      {/* Question List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <BookMarked className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Bank soal kosong. Tambah soal pertama!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div key={q.id} className={`rounded-xl border bg-white p-4 transition-colors ${selected.has(q.id) ? "border-purple-300 bg-purple-50/30" : "border-gray-200"}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)}
                  className="mt-1 h-4 w-4 rounded accent-purple-600 cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{TYPE_LABELS[q.type]}</span>
                    {q.subject && (
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: q.subject.color + "20", color: q.subject.color }}>
                        {q.subject.name}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_LABELS[q.difficulty]?.cls}`}>
                      {DIFF_LABELS[q.difficulty]?.label}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">Skor: {q.score}</span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.content}</p>
                  {q.correctAnswer && (
                    <p className="mt-1 text-xs text-green-600">✓ {q.correctAnswer}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(q.id)} className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">Tambah Soal ke Bank</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tipe</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mapel</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value="">— Pilih Mapel —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Soal *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none" />
            </div>
            {form.type === "PILGAN" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Pilihan Jawaban</label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs text-gray-400">{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                  </div>
                ))}
              </div>
            )}
            {(form.type === "PILGAN" || form.type === "BENAR_SALAH" || form.type === "ISIAN") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {form.type === "BENAR_SALAH" ? "Jawaban (Benar/Salah)" : "Kunci Jawaban"}
                </label>
                {form.type === "BENAR_SALAH" ? (
                  <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                    <option value="">Pilih...</option>
                    <option value="Benar">Benar</option>
                    <option value="Salah">Salah</option>
                  </select>
                ) : (
                  <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Skor</label>
                <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                  min={1} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kesulitan</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <option value={1}>Mudah</option>
                  <option value={2}>Sedang</option>
                  <option value={3}>Sulit</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleAdd} disabled={!form.content}
                className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                Simpan ke Bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Import ke Ujian</h2>
            <p className="text-sm text-gray-500">{selected.size} soal dipilih</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Pilih Ujian Tujuan</label>
              <select value={targetExam} onChange={(e) => setTargetExam(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option value="">— Pilih Ujian —</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} ({e.class.name})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowImport(false)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleImport} disabled={!targetExam || isPending}
                className="flex-1 rounded-xl bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                {isPending ? "Mengimport..." : "Import Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
