"use client";

import { useState } from "react";
import { Sparkles, Loader2, X, CheckCircle, Save, AlertCircle, ImageIcon, Copy, Check, ExternalLink } from "lucide-react";
import MathRenderer from "@/components/ui/MathRenderer";
import SelectOrCustom from "@/components/ui/SelectOrCustom";
import ImageUploadButton from "./ImageUploadButton";
import { AI_PROVIDERS, AIProviderId, DEFAULT_PROVIDER_ID, getProvider } from "@/lib/ai-providers";

const JENJANG_OPTIONS = ["SD / MI", "SMP / MTs", "SMA / MA", "SMK", "Perguruan Tinggi"];
const KURIKULUM_OPTIONS = ["Kurikulum Merdeka", "Kurikulum 2013", "Kurikulum Cambridge", "Kurikulum IB"];
const BAHASA_OPTIONS = ["Bahasa Indonesia", "Bahasa Inggris (English)", "Bahasa Jawa", "Bahasa Arab"];

interface Subject { id: string; name: string }

interface MatchingPair {
  left: string;
  right: string;
}

interface GeneratedQuestion {
  type: string;
  content: string;
  options?: string[] | MatchingPair[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: number;
  score?: number;
  imagePrompt?: string;
  imageUrl?: string;
}

const IMAGE_AI_SITES = [
  { name: "ChatGPT / DALL·E", url: "https://chat.openai.com/" },
  { name: "Gemini Imagen", url: "https://gemini.google.com/" },
  { name: "Leonardo AI", url: "https://app.leonardo.ai/" },
  { name: "Bing Image Creator", url: "https://www.bing.com/images/create" },
];

const TYPE_OPTIONS = [
  { value: "PILGAN", label: "Pilihan Ganda" },
  { value: "PILGAN_KOMPLEK", label: "Pilgan Kompleks" },
  { value: "BENAR_SALAH", label: "Benar / Salah" },
  { value: "MENJODOHKAN", label: "Menjodohkan" },
  { value: "ESSAY", label: "Essay" },
  { value: "ISIAN", label: "Isian Singkat" },
];

/** Type guard so matching pairs can be rendered differently from plain options. */
function isPairList(options: GeneratedQuestion["options"]): options is MatchingPair[] {
  return Array.isArray(options) && typeof options[0] === "object" && options[0] !== null;
}

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
  const [copiedImgIdx, setCopiedImgIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    topic: "",
    subjectId: subjectId ?? "",
    customSubject: "",
    questionType: "PILGAN",
    difficulty: 2,
    count: 5,
    aiProvider: DEFAULT_PROVIDER_ID as AIProviderId,
    aiModel: "",
    jenjang: JENJANG_OPTIONS[0],
    kurikulum: KURIKULUM_OPTIONS[0],
    bahasa: BAHASA_OPTIONS[0],
    optionCount: 4,
    detailInstruction: "",
    sourceMaterial: "",
    strictMode: false,
    imageMode: false,
  });

  /** Prefer the typed subject name, else the selected subject from the list. */
  const effectiveSubjectName =
    form.customSubject.trim() || subjects.find((s) => s.id === form.subjectId)?.name || "";

  const isMultipleChoice = form.questionType === "PILGAN" || form.questionType === "PILGAN_KOMPLEK";
  const isMatching = form.questionType === "MENJODOHKAN";
  const providerModels = getProvider(form.aiProvider).models;

  /** Model slugs differ per provider, so reset the model when the provider changes. */
  function handleProviderChange(providerId: AIProviderId) {
    setForm((f) => ({ ...f, aiProvider: providerId, aiModel: "" }));
  }

  function buildPayload(saveToBank: boolean) {
    return {
      topic: form.topic,
      subjectName: effectiveSubjectName,
      questionType: form.questionType,
      difficulty: form.difficulty,
      count: form.count,
      subjectId: form.subjectId || null,
      examId: examId ?? null,
      aiProvider: form.aiProvider,
      aiModel: form.aiModel || undefined,
      jenjang: form.jenjang,
      kurikulum: form.kurikulum,
      bahasa: form.bahasa,
      optionCount: isMultipleChoice || isMatching ? form.optionCount : undefined,
      detailInstruction: form.detailInstruction.trim() || undefined,
      sourceMaterial: form.sourceMaterial.trim() || undefined,
      strictMode: form.strictMode && form.sourceMaterial.trim() !== "",
      imageMode: form.imageMode,
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

  async function handleCopyImagePrompt(idx: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedImgIdx(idx);
    setTimeout(() => setCopiedImgIdx(null), 2000);
  }

  async function handleSaveAll() {
    if (questions.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      // Send back the previewed questions (with any uploaded images) so nothing
      // is regenerated and the images stay attached to their question.
      const res = await fetch("/api/guru/bank-soal/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionsToSave: questions,
          subjectId: form.subjectId || null,
          examId: examId ?? null,
          topic: form.topic,
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
    setCopiedImgIdx(null);
    setForm({
      topic: "",
      subjectId: subjectId ?? "",
      customSubject: "",
      questionType: "PILGAN",
      difficulty: 2,
      count: 5,
      aiProvider: DEFAULT_PROVIDER_ID,
      aiModel: "",
      jenjang: JENJANG_OPTIONS[0],
      kurikulum: KURIKULUM_OPTIONS[0],
      bahasa: BAHASA_OPTIONS[0],
      optionCount: 4,
      detailInstruction: "",
      sourceMaterial: "",
      strictMode: false,
      imageMode: false,
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">AI Provider</label>
                  <select
                    value={form.aiProvider}
                    onChange={(e) => handleProviderChange(e.target.value as AIProviderId)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    {AI_PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">AI Model</label>
                  <select
                    value={form.aiModel}
                    onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Default (server) —</option>
                    {providerModels.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
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
                    Nama Mapel Custom <span className="text-gray-500">(opsional)</span>
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
                    {isMatching ? "Jumlah Pasangan" : "Jumlah Opsi"}{" "}
                    {!isMultipleChoice && !isMatching && <span className="text-gray-500">(n/a)</span>}
                  </label>
                  <select
                    value={form.optionCount}
                    disabled={!isMultipleChoice && !isMatching}
                    onChange={(e) => setForm({ ...form, optionCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {isMatching ? (
                      <>
                        <option value={3}>3 Pasangan</option>
                        <option value={4}>4 Pasangan</option>
                        <option value={5}>5 Pasangan</option>
                      </>
                    ) : (
                      <>
                        <option value={3}>3 Opsi (A-C) — SD</option>
                        <option value={4}>4 Opsi (A-D) — SMP</option>
                        <option value={5}>5 Opsi (A-E) — SMA</option>
                      </>
                    )}
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
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Mode Soal</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({ ...form, imageMode: false })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      !form.imageMode
                        ? "border-purple-500 bg-purple-50 text-purple-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${!form.imageMode ? "border-purple-600" : "border-gray-300"}`}>
                      {!form.imageMode && <span className="h-2 w-2 rounded-full bg-purple-600" />}
                    </span>
                    Tidak Bergambar
                  </button>
                  <button
                    onClick={() => setForm({ ...form, imageMode: true })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      form.imageMode
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${form.imageMode ? "border-indigo-600" : "border-gray-300"}`}>
                      {form.imageMode && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </span>
                    <ImageIcon className="h-4 w-4" /> Bergambar
                  </button>
                </div>
                {form.imageMode && (
                  <p className="mt-1.5 text-xs text-indigo-700">
                    AI akan menyertakan <strong>prompt gambar</strong> di tiap soal. Buat gambarnya di AI image generator, lalu unggah di preview.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Detail Instruksi <span className="text-gray-500">(opsional, bikin soal lebih spesifik)</span>
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
                  Sumber Materi Khusus <span className="text-gray-500">(opsional)</span>
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

                {questions.some((q) => q.imagePrompt) && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-800">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Salin prompt gambar tiap soal ke AI image generator, lalu unggah hasilnya:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {IMAGE_AI_SITES.map((s) => (
                        <a
                          key={s.name}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
                        >
                          {s.name} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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
                        {q.imagePrompt && (
                          <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            <ImageIcon className="h-3 w-3" /> Bergambar
                          </span>
                        )}
                      </div>

                      {q.imagePrompt && (
                        <div className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2.5">
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-indigo-800">Prompt Gambar</span>
                            <button
                              onClick={() => handleCopyImagePrompt(i, q.imagePrompt ?? "")}
                              className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                              {copiedImgIdx === i
                                ? <><Check className="h-3 w-3" /> Tersalin</>
                                : <><Copy className="h-3 w-3" /> Copy</>}
                            </button>
                          </div>
                          <p className="text-xs italic text-indigo-900">{q.imagePrompt}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <ImageUploadButton
                              url={q.imageUrl}
                              onChange={(url) =>
                                setQuestions((prev) =>
                                  prev.map((item, j) => (j === i ? { ...item, imageUrl: url } : item))
                                )
                              }
                              label={`Gambar soal ${i + 1}`}
                              size="md"
                            />
                            <p className="text-xs text-indigo-700">
                              {q.imageUrl
                                ? "Gambar siap — akan otomatis terhubung ke soal ini."
                                : "Buat gambar dari prompt di atas, lalu unggah di sini."}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-sm text-gray-800 mb-1">
                        <span className="font-medium">{i + 1}.</span>{" "}
                        <MathRenderer content={q.content} />
                      </p>
                      {q.options && q.options.length > 0 && (
                        isPairList(q.options) ? (
                          <div className="ml-4 space-y-0.5">
                            {q.options.map((pair, j) => (
                              <p key={j} className="text-xs text-gray-600">
                                <span className="font-medium">{j + 1}.</span> {pair.left}
                                <span className="mx-1 text-purple-500">↔</span>
                                {pair.right}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-4 space-y-0.5">
                            {q.options.map((opt, j) => (
                              <p key={j} className="text-xs text-gray-600">
                                <span className="font-medium">{String.fromCharCode(65 + j)}.</span> {opt}
                              </p>
                            ))}
                          </div>
                        )
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
