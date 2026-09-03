"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Upload, Search, BookMarked, X, FileDown, FileUp, Download, Edit3 } from "lucide-react";
import MediaUploadButton, { type MediaValue, parseMediaFromContent, mediaToHtml, stripMediaFromContent } from "./MediaUploadButton";
import { normalizeOptions, optionText, toOptionPayload } from "@/lib/question-options";
import { getInstruction, getBenarSalahLabels, getSetujuTidakLabels, type QuestionLang } from "@/lib/question-instructions";
import BankSoalImportClient from "./BankSoalImportClient";
import AIQuestionGenerator from "./AIQuestionGenerator";
import AIPromptWizard from "./AIPromptWizard";
import MathRenderer from "@/components/ui/MathRenderer";

type QuestionType = "PILGAN" | "PILGAN_KOMPLEK" | "BENAR_SALAH" | "MENJODOHKAN" | "MENGURUTKAN" | "SETUJU_TIDAK" | "ESSAY" | "ISIAN";

const LANG_LABELS: Record<QuestionLang, string> = { id: "Bahasa Indonesia", en: "English", ar: "العربية" };

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
}

interface Subject { id: string; name: string; color: string }
interface Exam { id: string; title: string; class: { name: string } }

const DIFF_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: "Mudah", cls: "bg-green-100 text-green-700" },
  2: { label: "Sedang", cls: "bg-yellow-100 text-yellow-700" },
  3: { label: "Sulit", cls: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<QuestionType, string> = {
  PILGAN:        "Pilihan Ganda",
  PILGAN_KOMPLEK:"Pilgan Kompleks",
  BENAR_SALAH:   "Benar / Salah",
  MENJODOHKAN:   "Menjodohkan",
  MENGURUTKAN:   "Mengurutkan",
  SETUJU_TIDAK:  "Setuju / Tidak",
  ESSAY:         "Essay",
  ISIAN:         "Isian Singkat",
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
  const [filterTag, setFilterTag] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showXlsxImport, setShowXlsxImport] = useState(false);
  const [targetExam, setTargetExam] = useState("");
  const [isPending, startTransition] = useTransition();

  const allTags = Array.from(
    new Set(questions.flatMap((q) => (q.tags as string[] | null) ?? []))
  ).sort();

  const BLANK_FORM = {
    subjectId: "", type: "PILGAN" as QuestionType,
    lang: "id" as QuestionLang,
    content: "",
    media: { type: "none", url: "" } as MediaValue,
    options: ["", "", "", ""] as string[],
    optionImages: ["", "", "", ""] as string[],
    correctAnswer: "",
    correctIndices: [] as number[],
    pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] as { left: string; right: string }[],
    orderedItems: ["", "", "", ""] as string[],
    orderedItemImages: ["", "", "", ""] as string[],
    statements: [{ text: "", answer: "SETUJU" as "SETUJU" | "TIDAK" }, { text: "", answer: "SETUJU" as "SETUJU" | "TIDAK" }] as { text: string; answer: "SETUJU" | "TIDAK" }[],
    explanation: "", score: 1, difficulty: 2,
  };
  const [form, setForm] = useState(BLANK_FORM);

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.content.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || q.subjectId === filterSubject;
    const matchType = !filterType || q.type === filterType;
    const matchTag = !filterTag || (q.tags as string[] | null)?.includes(filterTag);
    return matchSearch && matchSubject && matchType && matchTag;
  });

  function toggleSelect(id: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  /** Resize the answer choices (3 for SD, 4 for SMP, 5 for SMA) keeping entered values. */
  function setOptionCount(n: number) {
    setForm((prev) => ({
      ...prev,
      options: Array.from({ length: n }, (_, i) => prev.options[i] ?? ""),
      optionImages: Array.from({ length: n }, (_, i) => prev.optionImages[i] ?? ""),
      correctIndices: prev.correctIndices.filter((i) => i < n),
    }));
  }

  function OptionCountSelect() {
    return (
      <select
        value={form.options.length}
        onChange={(e) => setOptionCount(Number(e.target.value))}
        className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
      >
        <option value={3}>3 Opsi (A-C) — SD</option>
        <option value={4}>4 Opsi (A-D) — SMP</option>
        <option value={5}>5 Opsi (A-E) — SMA</option>
      </select>
    );
  }

  function parseQuestionToForm(q: Question): typeof BLANK_FORM {
    const media = parseMediaFromContent(q.content);
    const contentText = stripMediaFromContent(q.content);

    const opts = normalizeOptions(q.options as unknown[] | null);
    const optTexts = opts.map((o) => o.text);
    const optImages = opts.map((o) => o.imageUrl ?? "");
    while (optTexts.length < 4) { optTexts.push(""); optImages.push(""); }

    let correctIndices: number[] = [];
    if (q.type === "PILGAN_KOMPLEK" && q.correctAnswer) {
      const correctTexts = q.correctAnswer.split("|");
      correctIndices = optTexts.map((t, i) => correctTexts.includes(t) ? i : -1).filter((i) => i >= 0);
    }

    let pairs = BLANK_FORM.pairs;
    if (q.type === "MENJODOHKAN" && q.options) {
      const raw = q.options as unknown[];
      pairs = raw.map((o) => {
        if (o && typeof o === "object" && "left" in o) {
          const obj = o as Record<string, unknown>;
          return { left: String(obj.left ?? ""), right: String(obj.right ?? "") };
        }
        return { left: "", right: "" };
      });
      while (pairs.length < 2) pairs = [...pairs, { left: "", right: "" }];
    }

    let orderedItems = BLANK_FORM.orderedItems;
    let orderedItemImages = BLANK_FORM.orderedItemImages;
    if (q.type === "MENGURUTKAN") {
      orderedItems = [...optTexts];
      orderedItemImages = [...optImages];
      while (orderedItems.length < 4) { orderedItems.push(""); orderedItemImages.push(""); }
    }

    let statements = BLANK_FORM.statements;
    if (q.type === "SETUJU_TIDAK" && q.options && q.correctAnswer) {
      const answers = q.correctAnswer.split(",");
      statements = (q.options as string[]).map((text, i) => ({
        text,
        answer: (answers[i] === "TIDAK" ? "TIDAK" : "SETUJU") as "SETUJU" | "TIDAK",
      }));
      if (statements.length === 0) statements = [{ text: "", answer: "SETUJU" }];
    }

    return {
      subjectId: q.subjectId ?? "",
      type: q.type,
      lang: "id" as QuestionLang,
      content: contentText,
      media,
      options: optTexts,
      optionImages: optImages,
      correctAnswer: q.correctAnswer ?? "",
      correctIndices,
      pairs,
      orderedItems,
      orderedItemImages,
      statements,
      explanation: q.explanation ?? "",
      score: q.score,
      difficulty: q.difficulty,
    };
  }

  function startEdit(q: Question) {
    setForm(parseQuestionToForm(q));
    setEditingId(q.id);
    setShowAdd(true);
  }

  function startAdd() {
    setForm(BLANK_FORM);
    setEditingId(null);
    setShowAdd(true);
  }

  async function handleAdd() {
    const instruction = getInstruction(form.type, form.lang);
    const mediaHtml = mediaToHtml(form.media);
    const contentParts = [form.content];
    if (instruction) contentParts.push(`<p class="text-xs text-gray-500 italic">${instruction}</p>`);
    if (mediaHtml) contentParts.push(mediaHtml);
    const content = contentParts.filter(Boolean).join("\n\n");

    const body: Record<string, unknown> = {
      subjectId: form.subjectId || null,
      type: form.type,
      content,
      explanation: form.explanation || null,
      score: form.score,
      difficulty: form.difficulty,
    };

    const bsLabels = getBenarSalahLabels(form.lang);
    const stLabels = getSetujuTidakLabels(form.lang);

    switch (form.type) {
      case "PILGAN": {
        body.options = form.options
          .map((text, i) => toOptionPayload(text, form.optionImages[i]))
          .filter((o) => optionText(o));
        body.correctAnswer = form.correctAnswer || null;
        break;
      }
      case "PILGAN_KOMPLEK": {
        const opts = form.options
          .map((text, i) => toOptionPayload(text, form.optionImages[i]))
          .filter((o) => optionText(o));
        body.options = opts;
        body.correctAnswer = form.correctIndices
          .map((i) => form.options[i]).filter(Boolean).sort().join("|");
        break;
      }
      case "BENAR_SALAH":
        body.options = [bsLabels.benar, bsLabels.salah];
        body.correctAnswer = form.correctAnswer || null;
        break;
      case "MENJODOHKAN": {
        const valid = form.pairs.filter((p) => p.left && p.right);
        body.options = valid;
        body.correctAnswer = null;
        break;
      }
      case "MENGURUTKAN": {
        const items = form.orderedItems
          .map((text, i) => toOptionPayload(text, form.orderedItemImages[i]))
          .filter((o) => optionText(o));
        body.options = items;
        body.correctAnswer = items.map(optionText).join(",");
        break;
      }
      case "SETUJU_TIDAK": {
        const stmts = form.statements.filter((s) => s.text);
        body.options = stmts.map((s) => s.text);
        body.correctAnswer = stmts.map((s) => s.answer).join(",");
        break;
      }
      case "ISIAN":
      case "ESSAY":
        body.correctAnswer = form.correctAnswer || null;
        break;
    }

    if (editingId) {
      const res = await fetch(`/api/guru/bank-soal/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const q = await res.json();
        setQuestions((prev) => prev.map((old) => (old.id === editingId ? q : old)));
        setShowAdd(false);
        setEditingId(null);
        setForm(BLANK_FORM);
      }
    } else {
      const res = await fetch("/api/guru/bank-soal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const q = await res.json();
        setQuestions((prev) => [q, ...prev]);
        setShowAdd(false);
        setForm(BLANK_FORM);
      }
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

  async function handleExport(format: "xlsx" | "json" | "doc") {
    const params = new URLSearchParams({ format });
    if (filterSubject) params.set("subjectId", filterSubject);
    if (filterType) params.set("type", filterType);
    const a = document.createElement("a");
    a.href = `/api/guru/bank-soal/export?${params.toString()}`;
    a.click();
    setShowExport(false);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari soal..." className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">Semua Mapel</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="">Semua Tipe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {allTags.length > 0 && (
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">Semua Tag</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <div className="flex gap-2 ml-auto">
          {selected.size > 0 && (
            <button onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              <Upload className="h-4 w-4" /> Pakai di Ujian ({selected.size})
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <FileDown className="h-4 w-4" /> Export
            </button>
            {showExport && (
              <div className="absolute right-0 top-full pt-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 min-w-[160px]">
                <button onClick={() => handleExport("xlsx")} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <Download className="h-4 w-4 text-green-600" /> Export Excel
                </button>
                <button onClick={() => handleExport("doc")} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <Download className="h-4 w-4 text-indigo-600" /> Export Word
                </button>
                <button onClick={() => handleExport("json")} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                  <Download className="h-4 w-4 text-blue-600" /> Export JSON
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setShowXlsxImport(true)}
            className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
            <FileUp className="h-4 w-4" /> Import Excel
          </button>
          <AIQuestionGenerator subjects={subjects} onSaved={() => window.location.reload()} />
          <AIPromptWizard subjects={subjects} onSaved={() => window.location.reload()} />
          <button onClick={() => startAdd()}
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
                  <div className="text-sm text-gray-800 line-clamp-3">
                    <MathRenderer content={q.content} />
                  </div>
                  {q.content.includes("<img") && (
                    <div className="mt-2 text-xs text-indigo-600">📎 memiliki gambar soal</div>
                  )}
                  {q.content.includes("<audio") && (
                    <div className="mt-2 text-xs text-purple-600">🎵 memiliki audio soal</div>
                  )}
                  {q.content.includes("<video") && (
                    <div className="mt-2 text-xs text-blue-600">🎬 memiliki video soal</div>
                  )}
                  {q.content.includes("<iframe") && (
                    <div className="mt-2 text-xs text-red-600">▶️ memiliki video YouTube soal</div>
                  )}
                  {(q.tags as string[] | null)?.length ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(q.tags as string[]).map((tag) => (
                        <button key={tag} onClick={() => setFilterTag(tag)}
                          className="rounded-full bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 px-2 py-0.5 text-xs transition-colors">
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {q.correctAnswer && (
                    <p className="mt-1 text-xs text-green-600">✓ <MathRenderer content={q.correctAnswer} /></p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => startEdit(q)} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(q.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "Edit Soal" : "Tambah Soal ke Bank"}</h2>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Tipe + Mapel + Bahasa */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tipe Soal</label>
                <select value={form.type}
                  onChange={(e) => setForm({ ...BLANK_FORM, type: e.target.value as QuestionType, subjectId: form.subjectId, lang: form.lang, score: form.score, difficulty: form.difficulty })}
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
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Bahasa</label>
                <select value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value as QuestionLang })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  {Object.entries(LANG_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Instruksi otomatis */}
            {(() => { const inst = getInstruction(form.type, form.lang); return inst ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Instruksi otomatis ({LANG_LABELS[form.lang]}):</span> &ldquo;{inst}&rdquo;
                </p>
              </div>
            ) : null; })()}

            {/* Soal + Media */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {form.type === "MENJODOHKAN" || form.type === "SETUJU_TIDAK" || form.type === "MENGURUTKAN"
                  ? "Petunjuk / Instruksi (opsional)" : "Soal *"}
              </label>
              <div className="flex gap-3">
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3} placeholder={
                    form.type === "MENJODOHKAN" ? "Contoh: Jodohkan negara dengan ibu kotanya!"
                    : form.type === "MENGURUTKAN" ? "Contoh: Urutkan langkah-langkah berikut dari yang pertama!"
                    : form.type === "SETUJU_TIDAK" ? "Contoh: Tentukan apakah pernyataan berikut setuju atau tidak setuju!"
                    : "Ketik soal di sini..."
                  }
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <MediaUploadButton
                  value={form.media}
                  onChange={(val) => setForm({ ...form, media: val })}
                  label="Media soal"
                  size="md"
                />
              </div>
              {form.media.url && form.media.type !== "none" && (
                <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
                  <p className="text-xs text-gray-500 mb-1">Preview media:</p>
                  {form.media.type === "image" && <img src={form.media.url} alt="" className="max-h-32 rounded" />}
                  {form.media.type === "audio" && <audio controls src={form.media.url} className="w-full" />}
                  {form.media.type === "video" && <video controls src={form.media.url} className="max-h-32 rounded w-full" />}
                  {form.media.type === "youtube" && (
                    <iframe width="100%" height="120" src={form.media.url.replace("watch?v=", "embed/")} className="rounded" />
                  )}
                </div>
              )}
            </div>

            {/* PILGAN */}
            {form.type === "PILGAN" && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Pilihan Jawaban</label>
                  <select value={form.options.length} onChange={(e) => setOptionCount(Number(e.target.value))}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                    <option value={3}>3 Opsi (A-C)</option>
                    <option value={4}>4 Opsi (A-D)</option>
                    <option value={5}>5 Opsi (A-E)</option>
                  </select>
                </div>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <span className="w-6 text-center text-xs font-bold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }}
                      className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
                    <MediaUploadButton
                      value={{ type: form.optionImages[i] ? "image" : "none", url: form.optionImages[i] }}
                      onChange={(val) => { const imgs = [...form.optionImages]; imgs[i] = val.url; setForm({ ...form, optionImages: imgs }); }}
                      label={`Gambar opsi ${String.fromCharCode(65 + i)}`}
                      size="sm"
                    />
                  </div>
                ))}
                <div className="pt-1">
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban (tulis teks opsi yang benar)</label>
                  <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    placeholder="Contoh: Paris" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {/* PILGAN_KOMPLEK */}
            {form.type === "PILGAN_KOMPLEK" && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Pilihan Jawaban (centang semua yang benar)</label>
                  <select value={form.options.length} onChange={(e) => setOptionCount(Number(e.target.value))}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
                    <option value={3}>3 Opsi</option>
                    <option value={4}>4 Opsi</option>
                    <option value={5}>5 Opsi</option>
                  </select>
                </div>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <input type="checkbox" checked={form.correctIndices.includes(i)}
                      onChange={(e) => {
                        const ci = e.target.checked ? [...form.correctIndices, i] : form.correctIndices.filter((x) => x !== i);
                        setForm({ ...form, correctIndices: ci });
                      }}
                      className="h-4 w-4 rounded accent-amber-600" />
                    <span className="w-5 text-xs font-bold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }}
                      className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
                    <MediaUploadButton
                      value={{ type: form.optionImages[i] ? "image" : "none", url: form.optionImages[i] }}
                      onChange={(val) => { const imgs = [...form.optionImages]; imgs[i] = val.url; setForm({ ...form, optionImages: imgs }); }}
                      label={`Gambar opsi ${String.fromCharCode(65 + i)}`}
                      size="sm"
                    />
                  </div>
                ))}
                <p className="text-xs text-amber-600">✓ = jawaban benar (bisa lebih dari satu)</p>
              </div>
            )}

            {/* BENAR_SALAH */}
            {form.type === "BENAR_SALAH" && (() => {
              const bs = getBenarSalahLabels(form.lang);
              return (
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <label className="mb-2 block text-xs font-semibold text-gray-700">Jawaban Benar</label>
                <div className="flex gap-3">
                  {[bs.benar, bs.salah].map((val) => (
                    <label key={val} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                      form.correctAnswer === val ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                      <input type="radio" className="sr-only" checked={form.correctAnswer === val}
                        onChange={() => setForm({ ...form, correctAnswer: val })} />
                      {val === bs.benar ? `✓ ${val}` : `✗ ${val}`}
                    </label>
                  ))}
                </div>
              </div>
              );
            })()}

            {/* MENJODOHKAN */}
            {form.type === "MENJODOHKAN" && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Pasangan (Kiri → Kanan)</label>
                  <button onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: "", right: "" }] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah pasangan</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 px-1">
                  <span>Kolom Kiri</span>
                  <span>Kolom Kanan</span>
                </div>
                {form.pairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <span className="w-5 text-xs text-gray-400">{i + 1}.</span>
                    <input value={pair.left} onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], left: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Sisi kiri" className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" />
                    <span className="text-gray-400 text-lg">→</span>
                    <input value={pair.right} onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], right: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Pasangan kanan" className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" />
                    {form.pairs.length > 2 && (
                      <button onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* MENGURUTKAN */}
            {form.type === "MENGURUTKAN" && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Item (tulis dalam urutan yang BENAR)</label>
                  <button onClick={() => setForm({ ...form, orderedItems: [...form.orderedItems, ""], orderedItemImages: [...form.orderedItemImages, ""] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah item</button>
                </div>
                {form.orderedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>
                    <input value={item} onChange={(e) => { const o = [...form.orderedItems]; o[i] = e.target.value; setForm({ ...form, orderedItems: o }); }}
                      placeholder={`Item ke-${i + 1}`} className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" />
                    <MediaUploadButton
                      value={{ type: form.orderedItemImages[i] ? "image" : "none", url: form.orderedItemImages[i] }}
                      onChange={(val) => { const imgs = [...form.orderedItemImages]; imgs[i] = val.url; setForm({ ...form, orderedItemImages: imgs }); }}
                      label={`Gambar item ${i + 1}`}
                      size="sm"
                    />
                    {form.orderedItems.length > 2 && (
                      <button onClick={() => setForm({ ...form, orderedItems: form.orderedItems.filter((_, j) => j !== i), orderedItemImages: form.orderedItemImages.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-400">Siswa akan melihat item dalam urutan acak dan diminta mengurutkan kembali.</p>
              </div>
            )}

            {/* SETUJU_TIDAK */}
            {form.type === "SETUJU_TIDAK" && (() => {
              const st = getSetujuTidakLabels(form.lang);
              return (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Pernyataan + Jawaban Benar</label>
                  <button onClick={() => setForm({ ...form, statements: [...form.statements, { text: "", answer: "SETUJU" }] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah pernyataan</button>
                </div>
                {form.statements.map((stmt, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-1.5">
                    <span className="w-5 text-xs text-gray-400">{i + 1}.</span>
                    <input value={stmt.text} onChange={(e) => { const s = [...form.statements]; s[i] = { ...s[i], text: e.target.value }; setForm({ ...form, statements: s }); }}
                      placeholder={`Pernyataan ${i + 1}`} className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm" />
                    <select value={stmt.answer}
                      onChange={(e) => { const s = [...form.statements]; s[i] = { ...s[i], answer: e.target.value as "SETUJU" | "TIDAK" }; setForm({ ...form, statements: s }); }}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
                      <option value="SETUJU">✓ {st.setuju}</option>
                      <option value="TIDAK">✗ {st.tidak}</option>
                    </select>
                    {form.statements.length > 1 && (
                      <button onClick={() => setForm({ ...form, statements: form.statements.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>
              );
            })()}

            {/* ISIAN */}
            {form.type === "ISIAN" && (
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban</label>
                <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Jawaban yang diharapkan" />
              </div>
            )}

            {/* ESSAY */}
            {form.type === "ESSAY" && (
              <p className="text-xs text-gray-400 italic rounded-lg bg-gray-50 p-3 border border-gray-100">Essay dinilai manual oleh guru.</p>
            )}

            {/* Pembahasan */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Pembahasan (opsional, bisa diedit)</label>
              <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Pembahasan jawaban..." />
            </div>

            {/* Skor + Kesulitan */}
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

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={handleAdd} disabled={!form.content}
                className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                {editingId ? "Simpan Perubahan" : "Simpan ke Bank"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              onDone={(count) => {
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
