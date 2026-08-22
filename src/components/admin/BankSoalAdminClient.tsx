"use client";

import { useState, useTransition } from "react";
import {
  Plus, Trash2, Upload, Search, BookMarked, X, FileDown, FileUp,
  Download, Database, BarChart3, Edit3, CheckCircle2,
} from "lucide-react";
import MathRenderer from "@/components/ui/MathRenderer";
import BankSoalImportClient from "@/components/guru/BankSoalImportClient";
import AIQuestionGenerator from "@/components/guru/AIQuestionGenerator";
import AIPromptWizard from "@/components/guru/AIPromptWizard";

type QuestionType = "PILGAN" | "PILGAN_KOMPLEK" | "BENAR_SALAH" | "MENJODOHKAN" | "MENGURUTKAN" | "SETUJU_TIDAK" | "ESSAY" | "ISIAN";

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
  tags?: string[] | null;
  examQuestions?: { examId: string; exam: { title: string; class: { name: string } | null } }[];
}

interface Subject { id: string; name: string; color: string }
interface Exam { id: string; title: string; class: { name: string } | null }

interface Stats {
  total: number;
  usedInExams: number;
  byType: { type: QuestionType; count: number }[];
  byDifficulty: { difficulty: number; count: number }[];
  bySubject: { subjectId: string | null; subject: Subject | null; count: number }[];
}

const DIFF_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Mudah", cls: "bg-green-100 text-green-700" },
  2: { label: "Sedang", cls: "bg-yellow-100 text-yellow-700" },
  3: { label: "Sulit", cls: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<QuestionType, string> = {
  PILGAN:         "Pilihan Ganda",
  PILGAN_KOMPLEK: "Pilgan Kompleks",
  BENAR_SALAH:    "Benar / Salah",
  MENJODOHKAN:    "Menjodohkan",
  MENGURUTKAN:    "Mengurutkan",
  SETUJU_TIDAK:   "Setuju / Tidak",
  ESSAY:          "Essay",
  ISIAN:          "Isian Singkat",
};

export default function BankSoalAdminClient({
  initialQuestions,
  subjects,
  exams,
  stats,
}: {
  initialQuestions: Question[];
  subjects: Subject[];
  exams: Exam[];
  stats: Stats;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showXlsxImport, setShowXlsxImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [targetExam, setTargetExam] = useState("");
  const [isPending, startTransition] = useTransition();

  const allTags = Array.from(
    new Set(questions.flatMap((q) => (q.tags as string[] | null) ?? []))
  ).sort();

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.content.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || q.subjectId === filterSubject;
    const matchType = !filterType || q.type === filterType;
    const matchDiff = !filterDifficulty || q.difficulty === Number(filterDifficulty);
    const matchTag = !filterTag || (q.tags as string[] | null)?.includes(filterTag);
    return matchSearch && matchSubject && matchType && matchDiff && matchTag;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((q) => q.id)));
    }
  }

  async function handleImport() {
    if (!targetExam || selected.size === 0) return;
    startTransition(async () => {
      const res = await fetch(`/api/ujian/${targetExam}/import-soal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: [...selected] }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.imported} soal berhasil diimport ke ujian!`);
        setSelected(new Set());
        setShowImport(false);
        setTargetExam("");
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error ?? "Gagal import");
      }
    });
  }

  async function handleExport(format: "xlsx" | "json") {
    const params = new URLSearchParams({ format });
    if (filterSubject) params.set("subjectId", filterSubject);
    if (filterType) params.set("type", filterType);
    const a = document.createElement("a");
    a.href = `/api/admin/bank-soal/export?${params.toString()}`;
    a.click();
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <Database className="h-4 w-4" /> Total Soal
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4" /> Digunakan di Ujian
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.usedInExams}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <BookMarked className="h-4 w-4" /> Mapel
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.bySubject.length}</p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
            <BarChart3 className="h-4 w-4" /> Statistik Detail
          </div>
          <p className="mt-1 text-sm font-medium text-amber-600">{showStats ? "Sembunyikan" : "Lihat detail"}</p>
        </button>
      </div>

      {/* Detailed Stats */}
      {showStats && (
        <div className="grid md:grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Per Tipe Soal</h3>
            <div className="space-y-1.5">
              {stats.byType.map((t) => (
                <div key={t.type} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{TYPE_LABELS[t.type] ?? t.type}</span>
                  <span className="font-medium text-gray-900">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Per Kesulitan</h3>
            <div className="space-y-1.5">
              {stats.byDifficulty.map((d) => (
                <div key={d.difficulty} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{DIFF_LABELS[d.difficulty]?.label ?? `Level ${d.difficulty}`}</span>
                  <span className="font-medium text-gray-900">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Per Mata Pelajaran</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stats.bySubject.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{s.subject?.name ?? "Tanpa Mapel"}</span>
                  <span className="font-medium text-gray-900">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari soal..."
            className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Semua Mapel</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Semua Level</option>
          <option value="1">Mudah</option>
          <option value="2">Sedang</option>
          <option value="3">Sulit</option>
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua Tag</option>
            {allTags.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              <Upload className="h-4 w-4" /> Import ke Ujian ({selected.size})
            </button>
          )}
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FileDown className="h-4 w-4" /> Export
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 min-w-[150px]">
              <button
                onClick={() => handleExport("xlsx")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <Download className="h-4 w-4 text-green-600" /> Export Excel
              </button>
              <button
                onClick={() => handleExport("json")}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left"
              >
                <Download className="h-4 w-4 text-blue-600" /> Export JSON
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowXlsxImport(true)}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <FileUp className="h-4 w-4" /> Import Excel
          </button>
          <AIQuestionGenerator subjects={subjects} onSaved={() => window.location.reload()} />
          <AIPromptWizard subjects={subjects} onSaved={() => window.location.reload()} />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" /> Tambah Soal
          </button>
        </div>
      </div>

      {/* Select All */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded accent-amber-600 cursor-pointer"
          />
          <span>
            {selected.size > 0 ? `${selected.size} dipilih dari ${filtered.length}` : `${filtered.length} soal`}
          </span>
        </div>
      )}

      {/* Question List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <BookMarked className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Bank soal kosong. Tambah soal pertama!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div
              key={q.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                selected.has(q.id) ? "border-purple-300 bg-purple-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(q.id)}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1 h-4 w-4 rounded accent-purple-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {TYPE_LABELS[q.type]}
                    </span>
                    {q.subject && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: q.subject.color + "20",
                          color: q.subject.color,
                        }}
                      >
                        {q.subject.name}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_LABELS[q.difficulty]?.cls}`}>
                      {DIFF_LABELS[q.difficulty]?.label}
                    </span>
                    <span className="text-xs text-gray-400">Skor: {q.score}</span>
                    {q.examQuestions && q.examQuestions.length > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Dipakai di {q.examQuestions.length} ujian
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 line-clamp-3">
                    <MathRenderer content={q.content} />
                  </div>
                  {q.content.includes("<img") && (
                    <div className="mt-2 text-xs text-indigo-600">📎 memiliki gambar soal</div>
                  )}
                  {(q.tags as string[] | null)?.length ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(q.tags as string[]).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setFilterTag(tag)}
                          className="rounded-full bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 px-2 py-0.5 text-xs transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {q.correctAnswer && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ <MathRenderer content={q.correctAnswer} />
                    </p>
                  )}
                  {q.examQuestions && q.examQuestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.examQuestions.map((eq) => (
                        <span key={eq.examId} className="text-xs text-gray-400">
                          📝 {eq.exam.title}
                          {eq.exam.class ? ` (${eq.exam.class.name})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && <AddQuestionModal subjects={subjects} onClose={() => setShowAdd(false)} onAdded={(q) => { setQuestions((prev) => [q, ...prev]); setShowAdd(false); }} />}

      {/* Excel Import Modal */}
      {showXlsxImport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-6 my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Import Soal dari Excel</h2>
              <button onClick={() => setShowXlsxImport(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <BankSoalImportClient
              subjects={subjects}
              onDone={() => {
                setShowXlsxImport(false);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Import ke Ujian Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Import ke Ujian (M:N)</h2>
            <p className="text-sm text-gray-500">
              {selected.size} soal akan dihubungkan ke ujian. Soal tetap di bank soal dan bisa dipakai ulang.
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Pilih Ujian Tujuan</label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">— Pilih Ujian —</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} {e.class ? `(${e.class.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={!targetExam || isPending}
                className="flex-1 rounded-xl bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isPending ? "Mengimport..." : "Import Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/bank-soal/${id}`, { method: "DELETE" });
    if (res.ok) setQuestions((prev) => prev.filter((q) => q.id !== id));
  }
}

function AddQuestionModal({
  subjects,
  onClose,
  onAdded,
}: {
  subjects: Subject[];
  onClose: () => void;
  onAdded: (q: Question) => void;
}) {
  const [form, setForm] = useState({
    subjectId: "",
    type: "PILGAN" as QuestionType,
    content: "",
    options: ["", "", "", ""] as string[],
    correctAnswer: "",
    explanation: "",
    score: 1,
    difficulty: 2,
    tags: "",
  });

  async function handleAdd() {
    const body: Record<string, unknown> = {
      subjectId: form.subjectId || null,
      type: form.type,
      content: form.content,
      explanation: form.explanation || null,
      score: form.score,
      difficulty: form.difficulty,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    };

    switch (form.type) {
      case "PILGAN":
        body.options = form.options.filter((o) => o.trim());
        body.correctAnswer = form.correctAnswer || null;
        break;
      case "BENAR_SALAH":
        body.options = ["Benar", "Salah"];
        body.correctAnswer = form.correctAnswer || null;
        break;
      case "ISIAN":
      case "ESSAY":
        body.correctAnswer = form.correctAnswer || null;
        break;
      default:
        body.options = form.options.filter((o) => o.trim());
        body.correctAnswer = form.correctAnswer || null;
        break;
    }

    const res = await fetch("/api/admin/bank-soal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const q = await res.json();
      onAdded(q);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Tambah Soal ke Bank</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tipe Soal</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Mapel</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">— Pilih Mapel —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Soal *</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            placeholder="Ketik soal di sini..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {(form.type === "PILGAN" || form.type === "PILGAN_KOMPLEK") && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Pilihan Jawaban</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-medium text-gray-500">
                  {String.fromCharCode(65 + i)}.
                </span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const o = [...form.options];
                    o[i] = e.target.value;
                    setForm({ ...form, options: o });
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                  placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban</label>
              <input
                value={form.correctAnswer}
                onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Tulis teks opsi yang benar"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {form.type === "BENAR_SALAH" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Jawaban</label>
            <div className="flex gap-3">
              {["Benar", "Salah"].map((val) => (
                <button
                  key={val}
                  onClick={() => setForm({ ...form, correctAnswer: val })}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium ${
                    form.correctAnswer === val
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {val === "Benar" ? "✓ Benar" : "✗ Salah"}
                </button>
              ))}
            </div>
          </div>
        )}

        {(form.type === "ISIAN" || form.type === "ESSAY") && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban</label>
            <input
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Jawaban yang diharapkan"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Pembahasan (opsional)</label>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Tags (pisahkan dengan koma)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Matematika, Aljabar"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Skor</label>
            <input
              type="number"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              min={1}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Kesulitan</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value={1}>Mudah</option>
              <option value={2}>Sedang</option>
              <option value={3}>Sulit</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.content}
            className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Simpan ke Bank
          </button>
        </div>
      </div>
    </div>
  );
}
