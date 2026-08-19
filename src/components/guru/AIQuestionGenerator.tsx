"use client";

import { useState } from "react";
import { Sparkles, Loader2, X, CheckCircle, Save, AlertCircle } from "lucide-react";
import MathRenderer from "@/components/ui/MathRenderer";

interface Subject { id: string; name: string }

interface GeneratedQuestion {
  type: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: number;
  score?: number;
}

const TYPE_OPTIONS = [
  { value: "PILGAN", label: "Pilihan Ganda" },
  { value: "PILGAN_KOMPLEK", label: "Pilgan Kompleks" },
  { value: "BENAR_SALAH", label: "Benar / Salah" },
  { value: "ESSAY", label: "Essay" },
  { value: "ISIAN", label: "Isian Singkat" },
];

const DIFF_LABELS: Record<number, string> = { 1: "Mudah", 2: "Sedang", 3: "Sulit" };

export default function AIQuestionGenerator({
  subjects,
  subjectId,
  examId,
  onSaved,
}: {
  subjects: Subject[];
  subjectId?: string;
  examId?: string;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  const [form, setForm] = useState({
    topic: "",
    subjectId: subjectId ?? "",
    questionType: "PILGAN",
    difficulty: 2,
    count: 5,
  });

  async function handleGenerate() {
    if (!form.topic) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setSavedCount(0);

    try {
      const res = await fetch("/api/guru/bank-soal/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          subjectName: subjects.find((s) => s.id === form.subjectId)?.name,
          questionType: form.questionType,
          difficulty: form.difficulty,
          count: form.count,
          subjectId: form.subjectId || null,
          examId: examId ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal generate soal");
      } else {
        setQuestions(data.questions);
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/guru/bank-soal/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic,
          subjectName: subjects.find((s) => s.id === form.subjectId)?.name,
          questionType: form.questionType,
          difficulty: form.difficulty,
          count: form.count,
          subjectId: form.subjectId || null,
          examId: examId ?? null,
          saveToBank: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
      } else {
        setSavedCount(data.saved);
        if (onSaved) onSaved();
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setQuestions([]);
    setError(null);
    setSavedCount(0);
    setForm({ topic: "", subjectId: subjectId ?? "", questionType: "PILGAN", difficulty: 2, count: 5 });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
      >
        <Sparkles className="h-4 w-4" /> AI Generator
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 space-y-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">AI Question Generator</h2>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {savedCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">
                  {savedCount} soal berhasil disimpan ke bank soal!
                </p>
              </div>
            )}

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Topik / Materi *</label>
                <input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="Contoh: Turunan, Fotosintesis, Sejarah Indonesia..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mapel</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Umum —</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tipe Soal</label>
                  <select
                    value={form.questionType}
                    onChange={(e) => setForm({ ...form, questionType: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Jumlah Soal</label>
                  <input
                    type="number"
                    value={form.count}
                    onChange={(e) => setForm({ ...form, count: Math.min(20, Math.max(1, Number(e.target.value))) })}
                    min={1}
                    max={20}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !form.topic}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> AI sedang membuat soal...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate {form.count} Soal
                  </>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generated Questions Preview */}
            {questions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {questions.length} soal dihasilkan
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan ke Bank Soal
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {q.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {DIFF_LABELS[q.difficulty ?? 2]} • Skor: {q.score ?? 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mb-1">
                        <span className="font-medium">{i + 1}.</span>{" "}
                        <MathRenderer content={q.content} />
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="ml-4 space-y-0.5">
                          {q.options.map((opt, j) => (
                            <p key={j} className="text-xs text-gray-600">
                              <span className="font-medium">{String.fromCharCode(65 + j)}.</span> {opt}
                            </p>
                          ))}
                        </div>
                      )}
                      {q.correctAnswer && (
                        <p className="mt-1 text-xs text-green-600">
                          ✓ Jawaban: {q.correctAnswer}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-1 text-xs text-gray-500 italic">
                          📝 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {questions.length === 0 && !loading && !error && (
              <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-xs text-purple-700 space-y-1">
                <p className="font-semibold">Tips:</p>
                <p>• Tulis topik yang spesifik untuk hasil lebih akurat (contoh: "Limit fungsi aljabar" bukan "Matematika")</p>
                <p>• AI akan generate soal dalam Bahasa Indonesia</p>
                <p>• Preview soal sebelum simpan ke bank soal</p>
                <p>• Maksimal 20 soal per generate</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
