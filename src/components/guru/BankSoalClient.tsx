"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Upload, Search, BookMarked, X } from "lucide-react";
import ImageUploadButton from "./ImageUploadButton";
import { normalizeOptions, optionText, toOptionPayload } from "@/lib/question-options";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [targetExam, setTargetExam] = useState("");
  const [isPending, startTransition] = useTransition();

  const BLANK_FORM = {
    subjectId: "", type: "PILGAN" as QuestionType,
    content: "",
    contentImageUrl: "",
    options: ["", "", "", ""] as string[],
    optionImages: ["", "", "", ""] as string[],
    correctAnswer: "",
    correctIndices: [] as number[],
    pairs: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }] as { left: string; right: string; leftImage?: string; rightImage?: string }[],
    orderedItems: ["", "", "", ""] as string[],
    orderedItemImages: ["", "", "", ""] as string[],
    statements: [{ text: "", answer: "SETUJU" as "SETUJU" | "TIDAK", imageUrl: "" }, { text: "", answer: "SETUJU" as "SETUJU" | "TIDAK", imageUrl: "" }] as { text: string; answer: "SETUJU" | "TIDAK"; imageUrl: string }[],
    explanation: "", score: 1, difficulty: 2,
  };
  const [form, setForm] = useState(BLANK_FORM);

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
    const content = form.contentImageUrl
      ? `${form.content}\n\n<img src="${form.contentImageUrl}" alt="Soal" class="max-h-48 rounded-lg" />`
      : form.content;

    const body: Record<string, unknown> = {
      subjectId: form.subjectId || null,
      type: form.type,
      content,
      explanation: form.explanation || null,
      score: form.score,
      difficulty: form.difficulty,
    };

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
        body.options = ["Benar", "Salah"];
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
                  <div className="text-sm text-gray-800 line-clamp-2 whitespace-pre-wrap">{q.content}</div>
                  {q.content.includes("<img") && (
                    <div className="mt-2 text-xs text-indigo-600">📎 memiliki gambar soal</div>
                  )}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Tambah Soal ke Bank</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Tipe + Mapel */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tipe Soal</label>
                <select value={form.type}
                  onChange={(e) => setForm({ ...BLANK_FORM, type: e.target.value as QuestionType, subjectId: form.subjectId, score: form.score, difficulty: form.difficulty })}
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

            {/* Pertanyaan */}
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
                <ImageUploadButton
                  url={form.contentImageUrl}
                  onChange={(url) => setForm({ ...form, contentImageUrl: url })}
                  label="Gambar soal"
                  size="md"
                />
              </div>
            </div>

            {/* PILGAN */}
            {form.type === "PILGAN" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Pilihan Jawaban</label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
                    <ImageUploadButton
                      url={form.optionImages[i]}
                      onChange={(url) => { const imgs = [...form.optionImages]; imgs[i] = url; setForm({ ...form, optionImages: imgs }); }}
                      label={`Gambar opsi ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban (tulis teks opsi yang benar)</label>
                  <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    placeholder="Contoh: Paris" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {/* PILGAN_KOMPLEK */}
            {form.type === "PILGAN_KOMPLEK" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Pilihan Jawaban (centang semua yang benar)</label>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" id={`ck-${i}`}
                      checked={form.correctIndices.includes(i)}
                      onChange={(e) => {
                        const ci = e.target.checked
                          ? [...form.correctIndices, i]
                          : form.correctIndices.filter((x) => x !== i);
                        setForm({ ...form, correctIndices: ci });
                      }}
                      className="h-4 w-4 rounded accent-amber-600" />
                    <span className="w-5 text-xs font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" placeholder={`Opsi ${String.fromCharCode(65 + i)}`} />
                    <ImageUploadButton
                      url={form.optionImages[i]}
                      onChange={(url) => { const imgs = [...form.optionImages]; imgs[i] = url; setForm({ ...form, optionImages: imgs }); }}
                      label={`Gambar opsi ${String.fromCharCode(65 + i)}`}
                    />
                  </div>
                ))}
                <p className="text-xs text-amber-600">✓ = jawaban benar (bisa lebih dari satu)</p>
              </div>
            )}

            {/* BENAR_SALAH */}
            {form.type === "BENAR_SALAH" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Jawaban Benar</label>
                <div className="flex gap-3">
                  {["Benar", "Salah"].map((val) => (
                    <label key={val} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                      form.correctAnswer === val ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                      <input type="radio" className="sr-only" checked={form.correctAnswer === val}
                        onChange={() => setForm({ ...form, correctAnswer: val })} />
                      {val === "Benar" ? "✓ Benar" : "✗ Salah"}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* MENJODOHKAN */}
            {form.type === "MENJODOHKAN" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Pasangan (Kiri → Kanan)</label>
                  <button onClick={() => setForm({ ...form, pairs: [...form.pairs, { left: "", right: "" }] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah pasangan</button>
                </div>
                {form.pairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-gray-400">{i + 1}.</span>
                    <input value={pair.left} onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], left: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Sisi kiri" className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                    <span className="text-gray-400">→</span>
                    <input value={pair.right} onChange={(e) => { const p = [...form.pairs]; p[i] = { ...p[i], right: e.target.value }; setForm({ ...form, pairs: p }); }}
                      placeholder="Pasangan kanan" className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Item (tulis dalam urutan yang BENAR, dari 1 ke terakhir)</label>
                  <button onClick={() => setForm({ ...form, orderedItems: [...form.orderedItems, ""], orderedItemImages: [...form.orderedItemImages, ""] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah item</button>
                </div>
                {form.orderedItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>
                    <input value={item} onChange={(e) => { const o = [...form.orderedItems]; o[i] = e.target.value; setForm({ ...form, orderedItems: o }); }}
                      placeholder={`Item ke-${i + 1}`} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                    <ImageUploadButton
                      url={form.orderedItemImages[i]}
                      onChange={(url) => { const imgs = [...form.orderedItemImages]; imgs[i] = url; setForm({ ...form, orderedItemImages: imgs }); }}
                      label={`Gambar item ${i + 1}`}
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
            {form.type === "SETUJU_TIDAK" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Pernyataan + Jawaban Benar</label>
                  <button onClick={() => setForm({ ...form, statements: [...form.statements, { text: "", answer: "SETUJU", imageUrl: "" }] })}
                    className="text-xs text-amber-600 hover:underline">+ Tambah pernyataan</button>
                </div>
                {form.statements.map((stmt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-gray-400">{i + 1}.</span>
                    <input value={stmt.text} onChange={(e) => { const s = [...form.statements]; s[i] = { ...s[i], text: e.target.value }; setForm({ ...form, statements: s }); }}
                      placeholder={`Pernyataan ${i + 1}`} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                    <select value={stmt.answer}
                      onChange={(e) => { const s = [...form.statements]; s[i] = { ...s[i], answer: e.target.value as "SETUJU" | "TIDAK" }; setForm({ ...form, statements: s }); }}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs">
                      <option value="SETUJU">✓ Setuju</option>
                      <option value="TIDAK">✗ Tidak</option>
                    </select>
                    {form.statements.length > 1 && (
                      <button onClick={() => setForm({ ...form, statements: form.statements.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ISIAN */}
            {form.type === "ISIAN" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban</label>
                <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Jawaban yang diharapkan" />
              </div>
            )}

            {/* ESSAY — no correct answer */}
            {form.type === "ESSAY" && (
              <p className="text-xs text-gray-400 italic">Essay dinilai manual oleh guru.</p>
            )}

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
