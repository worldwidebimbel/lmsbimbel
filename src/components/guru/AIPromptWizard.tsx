"use client";

import { useState } from "react";
import { Wand2, X, Copy, Check, ArrowRight, ArrowLeft, Loader2, AlertCircle, Save, ExternalLink } from "lucide-react";

interface Subject { id: string; name: string }

interface CompositionRow {
  key: string;
  label: string;
  promptType: string;
  dbType: string;
  hasOptions: boolean;
  optionCount: number;
  count: number;
  weight: number;
}

interface ParsedQuestion {
  type: string;
  weight?: number;
  question_text: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  opt_e?: string;
  answer_key?: string;
  discussion?: string;
}

const JENJANG_OPTIONS = ["SD / MI", "SMP / MTs", "SMA / MA", "SMK", "Perguruan Tinggi"];

const KURIKULUM_OPTIONS = ["Kurikulum Merdeka", "Kurikulum 2013", "Kurikulum Cambridge", "Kurikulum IB"];

const FASE_OPTIONS = [
  "Fase A (Kelas 1-2)",
  "Fase B (Kelas 3-4)",
  "Fase C (Kelas 5-6)",
  "Fase D (Kelas 7-9)",
  "Fase E (Kelas 10)",
  "Fase F (Kelas 11-12)",
];

const KOGNITIF_OPTIONS = [
  "C1 - Mengingat",
  "C2 - Memahami",
  "C3 - Menerapkan",
  "C4 - Menganalisis",
  "C5 - Mengevaluasi",
  "C6 - Mencipta",
  "C1 , C2 - Low Middle Order Thinking (LOT-MOT)",
  "C4 , C5 , C6 - Higher Order Thinking Skills (HOTS)",
  "C1-C6 - MIX (LOTS -> HOTS)",
];

const JENIS_UJIAN_OPTIONS = [
  "Latihan Harian",
  "UTS (Tengah Semester)",
  "UAS (Akhir Semester)",
  "AKM (Literasi/Numerasi)",
  "Olimpiade (HOTS)",
  "TKA (Tes Akademik)",
];

const BAHASA_OPTIONS = ["Bahasa Indonesia", "Bahasa Inggris (English)", "Bahasa Jawa", "Bahasa Arab"];

const DEFAULT_COMPOSITION: CompositionRow[] = [
  { key: "pg", label: "Pilihan Ganda", promptType: "PG", dbType: "PILGAN", hasOptions: true, optionCount: 5, count: 5, weight: 10 },
  { key: "complex", label: "PG Kompleks", promptType: "COMPLEX", dbType: "PILGAN_KOMPLEK", hasOptions: true, optionCount: 5, count: 0, weight: 10 },
  { key: "tf", label: "Benar / Salah", promptType: "TF", dbType: "BENAR_SALAH", hasOptions: false, optionCount: 0, count: 0, weight: 10 },
  { key: "agree", label: "Setuju / Tidak", promptType: "AGREE", dbType: "SETUJU_TIDAK", hasOptions: false, optionCount: 0, count: 0, weight: 10 },
  { key: "matching", label: "Menjodohkan", promptType: "MATCHING", dbType: "MENJODOHKAN", hasOptions: true, optionCount: 5, count: 0, weight: 10 },
  { key: "essay", label: "Essay / Uraian", promptType: "ESSAY", dbType: "ESSAY", hasOptions: false, optionCount: 0, count: 0, weight: 10 },
];

const AI_SITES = [
  { name: "ChatGPT", url: "https://chat.openai.com/" },
  { name: "Gemini", url: "https://gemini.google.com/" },
  { name: "Claude", url: "https://claude.ai/" },
  { name: "DeepSeek", url: "https://chat.deepseek.com/" },
];

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export default function AIPromptWizard({
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
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);

  const [identity, setIdentity] = useState({
    mapel: "",
    topik: "",
    jenjang: JENJANG_OPTIONS[0],
    kurikulum: KURIKULUM_OPTIONS[0],
    fase: FASE_OPTIONS[0],
    kognitif: KOGNITIF_OPTIONS[0],
    jenisUjian: JENIS_UJIAN_OPTIONS[0],
    bahasa: BAHASA_OPTIONS[0],
    subjectId: subjectId ?? "",
  });

  const [composition, setComposition] = useState<CompositionRow[]>(DEFAULT_COMPOSITION);
  const [materi, setMateri] = useState("");
  const [strictMode, setStrictMode] = useState(false);

  const totalSoal = composition.reduce((sum, r) => sum + r.count, 0);

  function updateComposition(key: string, field: "count" | "weight" | "optionCount", value: number) {
    setComposition((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function buildPrompt(): string {
    const active = composition.filter((r) => r.count > 0);

    const komposisiLines = active.map((r) => {
      if (r.key === "pg") {
        return `- ${r.count} butir soal Pilihan Ganda (${r.optionCount} Opsi Pilihan: A-${OPTION_LETTERS[r.optionCount - 1]}) dengan Bobot ${r.weight}.`;
      }
      if (r.key === "complex") {
        return `- ${r.count} butir soal Pilihan Ganda Kompleks (${r.optionCount} Opsi Pilihan: A-${OPTION_LETTERS[r.optionCount - 1]}) dengan Bobot ${r.weight}.`;
      }
      if (r.key === "matching") {
        return `- ${r.count} butir soal Menjodohkan (${r.optionCount} Pasangan) dengan Bobot ${r.weight}.`;
      }
      return `- ${r.count} butir soal ${r.label} dengan Bobot ${r.weight}.`;
    });

    const strictLine = strictMode
      ? "(WAJIB: Buat soal HANYA berdasarkan materi di atas. JANGAN gunakan pengetahuan di luar teks tersebut.)"
      : "(Gunakan materi di atas sebagai referensi utama.)";

    return `PERAN: Anda adalah penulis soal ujian profesional untuk jenjang ${identity.jenjang}.
TUGAS: Buat soal ujian ${identity.jenisUjian} yang valid, reliabel, dan bebas bias.

KONTEKS SPESIFIK:
- Mata Pelajaran: ${identity.mapel}
- Topik / Bab Utama: ${identity.topik}
- Kurikulum: ${identity.kurikulum}
- Target Peserta: ${identity.fase}
- Level Kognitif: ${identity.kognitif}
- BAHASA: ${identity.bahasa} (Gunakan untuk SEMUA teks soal/opsi/pembahasan).

KOMPOSISI SOAL (Total ${totalSoal} butir):
${komposisiLines.join("\n")}


MATERI / SUMBER:
"""
${materi}
"""
${strictLine}

ATURAN VALUE "TYPE" (WAJIB PERSIS):
Agar sistem bisa membaca, gunakan KODE berikut pada field "type" (Jangan diterjemahkan):
1. Pilihan Ganda Biasa -> "PG"
2. Pilihan Ganda Kompleks -> "COMPLEX"
3. Benar / Salah -> "TF"
4. Setuju / Tidak -> "AGREE"
5. Menjodohkan -> "MATCHING"
6. Uraian / Essay -> "ESSAY"

ATURAN FORMAT JSON (CRITICAL):
1. **MATCHING:** Pasangan Kiri dan Kanan HARUS digabung string pemisah " || ". Contoh: "Jakarta || Indonesia".

2. **TF & AGREE:** 
   - Kunci "A" (Benar/Setuju) atau "B" (Salah/Tidak).
   - Kosongkan teks opsi (opt_a, opt_b, dst isi string kosong "").
   - **WAJIB:** Di akhir 'question_text' (tanpa backtick), tambahkan kode HTML ini: 
     "<br><small class='text-danger fst-italic'>(Pilih: Benar / Salah)</small>" 
     atau 
     "<br><small class='text-success fst-italic'>(Pilih: Setuju / Tidak Setuju)</small> Gunakan bahasa soal yang dipilih !"

3. **COMPLEX:** 
   - Kunci string dipisah koma (Contoh: "A,C").
   - **WAJIB:** Di akhir 'question_text' (tanpa backtick), tambahkan kode HTML ini: 
     "<br><small class='text-primary fst-italic'>(Pilih semua jawaban yang benar!)</small> Gunakan bahasa soal yang dipilih !"

4. **LATEX:** Ganti backslash dengan "@@" (Contoh: @@sqrt{x}).

5. **OPSI (WAJIB LENGKAP):**  
   - Pastikan jumlah opsi/pasangan sesuai permintaan di atas (3/4/5).
   - Jika tipe PG/COMPLEX/MATCHING, **WAJIB** sertakan keys: "opt_a", "opt_b", "opt_c", "opt_d", "opt_e".
   - Jika jumlah opsi yang diminta kurang dari 5 (misal 3), key "opt_d" dan "opt_e" **TETAP HARUS ADA** tapi isinya string kosong ("").
   - **JANGAN MENGHAPUS KEY DARI JSON.**

6. **ANTI-NULL:** Jangan biarkan value null. Gunakan string kosong "" jika tidak ada data.

7. **NO IMAGE PLACEHOLDER:** 
   - JANGAN tuliskan teks penanda gambar seperti [Image of...], (Gambar...), atau [Insert Diagram].
   - question_text harus BERSIH, hanya berisi kalimat pertanyaan saja.

OUTPUT HARUS HANYA JSON ARRAY (WAJIB ADA ${totalSoal} SOAL):
[
  {
    "type": "PG", 
    "weight": 10,
    "question_text": "...",
    "opt_a": "...",
    "opt_b": "...",
    "opt_c": "...", 
    "opt_d": "...",
    "opt_e": "...",
    "answer_key": "...",
    "discussion": "..."
  }
]`;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleParseJson() {
    setError(null);
    setParsed([]);
    try {
      const cleaned = jsonInput
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const data = JSON.parse(cleaned);
      if (!Array.isArray(data)) {
        setError("JSON harus berupa array. Pastikan Anda menyalin seluruh output dari AI.");
        return;
      }
      if (data.length === 0) {
        setError("JSON array kosong.");
        return;
      }
      setParsed(data as ParsedQuestion[]);
    } catch (e) {
      setError(`JSON tidak valid: ${(e as Error).message}`);
    }
  }

  async function handleSave() {
    if (parsed.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/guru/bank-soal/ai-prompt-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: parsed,
          subjectId: identity.subjectId || null,
          examId: examId ?? null,
          topic: identity.topik,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan soal");
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
    setStep(1);
    setJsonInput("");
    setParsed([]);
    setError(null);
    setSavedCount(0);
    setCopied(false);
  }

  const canProceedStep1 = identity.mapel.trim() !== "" && identity.topik.trim() !== "";
  const canProceedStep2 = totalSoal > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-medium text-white hover:from-amber-600 hover:to-yellow-600 transition-all"
      >
        <Wand2 className="h-4 w-4" /> AI Prompt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-gray-900" />
                <h2 className="text-lg font-bold text-gray-900">AI Prompt Wizard</h2>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-black/10">
                <X className="h-5 w-5 text-gray-900" />
              </button>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-gray-200">
              <div
                className="h-full bg-gray-900 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            <div className="p-6 space-y-4">
              {/* STEP 1: Identitas */}
              {step === 1 && (
                <>
                  <h3 className="text-lg font-bold text-blue-600">Langkah 1: Identitas Ujian</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Mata Pelajaran</label>
                      <input
                        value={identity.mapel}
                        onChange={(e) => setIdentity({ ...identity, mapel: e.target.value })}
                        placeholder="Contoh: IPA / Matematika"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Topik / Bab</label>
                      <input
                        value={identity.topik}
                        onChange={(e) => setIdentity({ ...identity, topik: e.target.value })}
                        placeholder="Contoh: Rantai Makanan / Aljabar"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Jenjang</label>
                      <select
                        value={identity.jenjang}
                        onChange={(e) => setIdentity({ ...identity, jenjang: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {JENJANG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Kurikulum</label>
                      <select
                        value={identity.kurikulum}
                        onChange={(e) => setIdentity({ ...identity, kurikulum: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {KURIKULUM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Fase</label>
                      <select
                        value={identity.fase}
                        onChange={(e) => setIdentity({ ...identity, fase: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {FASE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Level Kognitif (Bloom)</label>
                    <select
                      value={identity.kognitif}
                      onChange={(e) => setIdentity({ ...identity, kognitif: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      {KOGNITIF_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Jenis Ujian</label>
                      <select
                        value={identity.jenisUjian}
                        onChange={(e) => setIdentity({ ...identity, jenisUjian: e.target.value })}
                        className="w-full rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-sm"
                      >
                        {JENIS_UJIAN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Bahasa Pengantar Soal</label>
                      <select
                        value={identity.bahasa}
                        onChange={(e) => setIdentity({ ...identity, bahasa: e.target.value })}
                        className="w-full rounded-lg border border-green-400 bg-green-50 px-3 py-2 text-sm"
                      >
                        {BAHASA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Simpan ke Mapel <span className="font-normal text-gray-400">(opsional)</span>
                    </label>
                    <select
                      value={identity.subjectId}
                      onChange={(e) => setIdentity({ ...identity, subjectId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">— Umum —</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                      className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      Selanjutnya <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {/* STEP 2: Komposisi */}
              {step === 2 && (
                <>
                  <h3 className="text-lg font-bold text-blue-600">Langkah 2: Komposisi Soal</h3>

                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">Isi jumlah soal pada tipe yang diinginkan. Kosongkan jika tidak perlu.</p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600">TIPE SOAL</th>
                          <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-600">SETTING</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {composition.map((row) => (
                          <tr key={row.key}>
                            <td className="px-4 py-3 font-semibold text-gray-800">{row.label}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {row.hasOptions && (
                                  <select
                                    value={row.optionCount}
                                    onChange={(e) => updateComposition(row.key, "optionCount", Number(e.target.value))}
                                    className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                                    title={row.key === "matching" ? "Jumlah pasangan" : "Jumlah opsi"}
                                  >
                                    {[3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                )}
                                <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                                  <span className="bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-600">Jml</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={50}
                                    value={row.count}
                                    onChange={(e) => updateComposition(row.key, "count", Math.max(0, Math.min(50, Number(e.target.value))))}
                                    className="w-14 px-2 py-1.5 text-xs font-bold text-center focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                                  <span className="bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-600">Bobot</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={row.weight}
                                    onChange={(e) => updateComposition(row.key, "weight", Math.max(1, Number(e.target.value)))}
                                    className="w-14 px-2 py-1.5 text-xs font-bold text-center focus:outline-none"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td className="px-4 py-2.5 text-xs font-bold text-gray-600">TOTAL</td>
                          <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">{totalSoal} soal</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 rounded-lg bg-gray-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      Selanjutnya <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3: Materi */}
              {step === 3 && (
                <>
                  <h3 className="text-lg font-bold text-blue-600">Langkah 3: Materi / Sumber</h3>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Paste Materi / Artikel / Topik Detail</label>
                    <textarea
                      value={materi}
                      onChange={(e) => setMateri(e.target.value)}
                      rows={8}
                      placeholder="Paste teks bacaan, rangkuman materi, atau detail instruksi di sini agar AI membuat soal yang relevan..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                      Buat soal <strong>HANYA</strong> berdasarkan teks di atas (Strict Mode).
                    </span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 rounded-lg bg-gray-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex items-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-500"
                    >
                      <Wand2 className="h-4 w-4" /> GENERATE PROMPT
                    </button>
                  </div>
                </>
              )}

              {/* STEP 4: Prompt + Paste JSON */}
              {step === 4 && (
                <>
                  <h3 className="text-lg font-bold text-blue-600">Langkah 4: Copy Prompt &amp; Paste Hasil</h3>

                  {savedCount > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-green-700">{savedCount} soal berhasil disimpan ke bank soal!</p>
                    </div>
                  )}

                  {/* Prompt box */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700">Prompt siap pakai</label>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                      >
                        {copied ? <><Check className="h-3.5 w-3.5" /> Tersalin</> : <><Copy className="h-3.5 w-3.5" /> Copy Prompt</>}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={buildPrompt()}
                      rows={10}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700"
                    />
                  </div>

                  {/* AI site links */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-amber-800">Buka salah satu AI, paste prompt di atas, lalu salin hasil JSON-nya:</p>
                    <div className="flex flex-wrap gap-2">
                      {AI_SITES.map((s) => (
                        <a
                          key={s.name}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                        >
                          {s.name} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* JSON paste */}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Paste Hasil JSON dari AI</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      rows={6}
                      placeholder='[{"type":"PG","weight":10,"question_text":"...","opt_a":"...","answer_key":"A","discussion":"..."}]'
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      onClick={handleParseJson}
                      disabled={!jsonInput.trim()}
                      className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      Parse &amp; Preview
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Preview */}
                  {parsed.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">{parsed.length} soal terdeteksi</h4>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Simpan ke Bank Soal
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {parsed.map((q, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{q.type}</span>
                              <span className="text-xs text-gray-500">Bobot: {q.weight ?? 10}</span>
                            </div>
                            <p
                              className="text-sm text-gray-800"
                              dangerouslySetInnerHTML={{ __html: `${i + 1}. ${q.question_text ?? ""}` }}
                            />
                            {[q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.opt_e].some((o) => o) && (
                              <div className="ml-4 mt-1 space-y-0.5">
                                {[q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.opt_e].map((opt, j) =>
                                  opt ? (
                                    <p key={j} className="text-xs text-gray-600">
                                      <span className="font-medium">{OPTION_LETTERS[j]}.</span> {opt}
                                    </p>
                                  ) : null
                                )}
                              </div>
                            )}
                            {q.answer_key && <p className="mt-1 text-xs text-green-600">✓ Kunci: {q.answer_key}</p>}
                            {q.discussion && <p className="mt-1 text-xs italic text-gray-500">📝 {q.discussion}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-start pt-2">
                    <button
                      onClick={() => setStep(3)}
                      className="flex items-center gap-2 rounded-lg bg-gray-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4" /> Kembali
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
