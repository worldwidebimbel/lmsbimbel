"use client";

import { useState } from "react";
import { Sparkles, Loader2, X, CheckCircle, Save, AlertCircle } from "lucide-react";
import MathRenderer from "@/components/ui/MathRenderer";
import SelectOrCustom from "@/components/ui/SelectOrCustom";

const JENJANG_OPTIONS = ["SD / MI", "SMP / MTs", "SMA / MA", "SMK", "Perguruan Tinggi"];
const KURIKULUM_OPTIONS = ["Kurikulum Merdeka", "Kurikulum 2013", "Kurikulum Cambridge", "Kurikulum IB"];
const BAHASA_OPTIONS = ["Bahasa Indonesia", "Bahasa Inggris (English)", "Bahasa Jawa", "Bahasa Arab"];

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

const AI_MODELS = [
  { value: "langgananku/claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Recommended)" },
  { value: "langgananku/claude-opus-5", label: "Claude Opus 5" },
  { value: "cbcn/glm-5.2", label: "GLM 5.2" },
  { value: "cbcn/deepseek-v3", label: "DeepSeek V3" },
  { value: "gcli/grok-3", label: "Grok 3" },
];

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
    customSubject: "",
    questionType: "PILGAN",
    difficulty: 2,
    count: 5,
    aiModel: "",
    jenjang: JENJANG_OPTIONS[0],
    kurikulum: KURIKULUM_OPTIONS[0],
    bahasa: BAHASA_OPTIONS[0],
    optionCount: 4,
    detailInstruction: "",
    sourceMaterial: "",
    strictMode: false,
  });

  /** Prefer the typed subject name, else the selected subject from the list. */
  const effectiveSubjectName =
    form.customSubject.trim() || subjects.find((s) => s.id === form.subjectId)?.name || "";

  const isMultipleChoice = form.questionType === "PILGAN" || form.questionType === "PILGAN_KOMPLEK";

  function buildPayload(saveToBank: boolean) {
    return {
      topic: form.topic,
      subjectName: effectiveSubjectName,
      questionType: form.questionType,
      difficulty: form.difficulty,
      count: form.count,
      subjectId: form.subjectId || null,
      examId: examId ?? null,
      aiModel: form.aiModel || undefined,
      jenjang: form.jenjang,
      kurikulum: form.kurikulum,
      bahasa: form.bahasa,
      optionCount: isMultipleChoice ? form.optionCount : undefined,
      detailInstruction: form.detailInstruction.trim() || undefined,
      sourceMaterial: form.sourceMaterial.trim() || undefined,
      strictMode: form.strictMode && form.sourceMaterial.trim() !== "",
      saveToBank,
    };
  }

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
        body: JSON.stringify(buildPayload(false)),
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
        body: JSON.stringify(buildPayload(true)),
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
    setForm({
      topic: "",
      subjectId: subjectId ?? "",
      customSubject: "",
      questionType: "PILGAN",
      difficulty: 2,
      count: 5,
      aiModel: "",
      jenjang: JENJANG_OPTIONS[0],
      kurikulum: KURIKULUM_OPTIONS[0],
      bahasa: BAHASA_OPTIONS[0],
      optionCount: 4,
      detailInstruction: "",
      sourceMaterial: "",
      strictMode: false,
    });
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

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">AI Model</label>
                <select
                  value={form.aiModel}
                  onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">— Default (server) —</option>
                  {AI_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mapel (simpan ke)</label>
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
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Nama Mapel Custom <span className="text-gray-400">(opsional)</span>
                  </label>
                  <input
                    value={form.customSubject}
                    onChange={(e) => setForm({ ...form, customSubject: e.target.value })}
                    placeholder="Contoh: Informatika / Coding"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectOrCustom
                  label="Jenjang"
                  value={form.jenjang}
                  onChange={(v) => setForm({ ...form, jenjang: v })}
                  options={JENJANG_OPTIONS}
                  placeholder="Contoh: Paket C"
                />
                <SelectOrCustom
                  label="Kurikulum"
                  value={form.kurikulum}
                  onChange={(v) => setForm({ ...form, kurikulum: v })}
                  options={KURIKULUM_OPTIONS}
                  placeholder="Contoh: Kurikulum 2027"
                />
                <SelectOrCustom
                  label="Bahasa Soal"
                  value={form.bahasa}
                  onChange={(v) => setForm({ ...form, bahasa: v })}
                  options={BAHASA_OPTIONS}
                  placeholder="Contoh: Bahasa Mandarin"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Jumlah Opsi {!isMultipleChoice && <span className="text-gray-400">(n/a)</span>}
                  </label>
                  <select
                    value={form.optionCount}
                    disabled={!isMultipleChoice}
                    onChange={(e) => setForm({ ...form, optionCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value={3}>3 Opsi (A-C) — SD</option>
                    <option value={4}>4 Opsi (A-D) — SMP</option>
                    <option value={5}>5 Opsi (A-E) — SMA</option>
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

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Detail Instruksi <span className="text-gray-400">(opsional, bikin soal lebih spesifik)</span>
                </label>
                <textarea
                  value={form.detailInstruction}
                  onChange={(e) => setForm({ ...form, detailInstruction: e.target.value })}
                  rows={3}
                  placeholder={"Contoh:\n- Buat soal cerita tentang kehidupan sehari-hari\n- Butuh 2 langkah perhitungan untuk menemukan jawaban"}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Sumber Materi Khusus <span className="text-gray-400">(opsional)</span>
                </label>
                <textarea
                  value={form.sourceMaterial}
                  onChange={(e) => setForm({ ...form, sourceMaterial: e.target.value })}
                  rows={4}
                  placeholder="Paste teks bacaan / rangkuman materi agar AI fokus pada sumber ini..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <label className={`mt-1.5 flex items-center gap-2 ${form.sourceMaterial.trim() ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                  <input
                    type="checkbox"
                    checked={form.strictMode && form.sourceMaterial.trim() !== ""}
                    disabled={!form.sourceMaterial.trim()}
                    onChange={(e) => setForm({ ...form, strictMode: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-700">
                    Buat soal <strong>HANYA</strong> dari materi di atas (Strict Mode)
                  </span>
                </label>
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
