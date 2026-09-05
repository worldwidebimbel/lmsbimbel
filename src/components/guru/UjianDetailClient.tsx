"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Eye, EyeOff, CheckCircle, XCircle, BookMarked } from "lucide-react";
import ImageUploadButton from "./ImageUploadButton";
import ToeflExamEditor from "./ToeflExamEditor";
import PickFromBankModal from "./PickFromBankModal";
import EssayGradingClient from "./EssayGradingClient";
import { normalizeOptions, optionText, toOptionPayload } from "@/lib/question-options";
import MathRenderer from "@/components/ui/MathRenderer";

interface Question {
  id: string; type: string; content: string; imageUrl?: string | null; audioUrl?: string | null; videoUrl?: string | null; options: string[] | null;
  correctAnswer: string | null; explanation: string | null; score: number; difficulty: number; sectionId?: string | null; groupId?: string | null;
}
interface Attempt { id: string; student: { name: string }; score: number | null; submittedAt: string | null; attemptNumber?: number }
interface Exam {
  id: string; title: string; duration: number; passingScore: number;
  isPublished: boolean; isRandomized: boolean; description: string | null;
  materialId?: string | null;
  classId?: string | null;
  material?: { id: string; title: string; chapterTitle: string | null } | null;
  questions: Question[]; _count: { attempts: number };
}

interface MaterialOption { id: string; title: string; chapterTitle: string | null }

interface ToeflSectionOption { id: string; name: string }
interface ToeflGroupOption { id: string; title: string | null; type: string }

const DIFF_LABEL = ["", "Mudah", "Sedang", "Sulit", "Sangat Sulit"];
const DIFF_COLOR = ["", "text-green-600", "text-yellow-600", "text-orange-600", "text-red-600"];

interface Subject { id: string; name: string; color: string }

interface EssayQuestion { id: string; content: string; score: number }
interface EssayAttempt {
  id: string;
  studentId: string;
  studentName: string;
  score: number | null;
  answers: Record<string, string> | null;
  submittedAt: string;
}

export default function UjianDetailClient({ exam: initial, attempts, subjects = [], materials = [], essayQuestions = [], essayAttempts = [] }: { exam: Exam; attempts: Attempt[]; subjects?: Subject[]; materials?: MaterialOption[]; essayQuestions?: EssayQuestion[]; essayAttempts?: EssayAttempt[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exam, setExam] = useState(initial);
  useEffect(() => { setExam(initial); }, [initial]);
  const [materialInput, setMaterialInput] = useState(initial.materialId ?? "");
  useEffect(() => { setMaterialInput(initial.materialId ?? ""); }, [initial.materialId]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"soal" | "hasil" | "toefl" | "essay">("soal");
  const [showPickBank, setShowPickBank] = useState(false);
  const [error, setError] = useState("");
  const [toeflSections, setToeflSections] = useState<ToeflSectionOption[]>([]);
  const [toeflGroups, setToeflGroups] = useState<ToeflGroupOption[]>([]);

  const loadToefl = useCallback(async () => {
    const res = await fetch(`/api/guru/ujian/toefl?examId=${initial.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setToeflSections(data.sections ?? []);
    setToeflGroups(data.groups ?? []);
  }, [initial.id]);

  useEffect(() => { loadToefl(); }, [loadToefl]);

  const [newQ, setNewQ] = useState({
    type: "PILGAN", content: "", contentImageUrl: "",
    audioUrl: "", videoUrl: "",
    options: ["", "", "", ""], optionImages: ["", "", "", ""],
    correctAnswer: "", explanation: "", score: "1", difficulty: "2",
    sectionId: "", groupId: "",
  });

  function updateOpt(i: number, v: string) {
    setNewQ((p) => { const o = [...p.options]; o[i] = v; return { ...p, options: o }; });
  }
  function updateOptImage(i: number, url: string) {
    setNewQ((p) => { const imgs = [...p.optionImages]; imgs[i] = url; return { ...p, optionImages: imgs }; });
  }

  async function handleTogglePublish() {
    const res = await fetch(`/api/guru/ujian/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !exam.isPublished }),
    });
    if (res.ok) { setExam((p) => ({ ...p, isPublished: !p.isPublished })); router.refresh(); }
  }

  async function handleSaveMaterial() {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/guru/ujian/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: materialInput || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Gagal menyimpan lampiran materi");
        return;
      }
      const updated = await res.json();
      setExam((p) => ({
        ...p,
        materialId: updated.materialId ?? null,
        material: materials.find((m) => m.id === updated.materialId) ?? null,
      }));
      router.refresh();
    });
  }

  function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault(); setError("");
    startTransition(async () => {
      const content = newQ.contentImageUrl
        ? `${newQ.content}\n\n<img src="${newQ.contentImageUrl}" alt="Soal" class="max-h-48 rounded-lg" />`
        : newQ.content;
      const payload: Record<string, unknown> = {
        type: newQ.type, content,
        imageUrl: newQ.contentImageUrl || null,
        audioUrl: newQ.audioUrl || null,
        videoUrl: newQ.videoUrl || null,
        score: Number(newQ.score), difficulty: Number(newQ.difficulty),
        explanation: newQ.explanation || null,
        correctAnswer: newQ.correctAnswer || null,
        sectionId: newQ.sectionId || null,
        groupId: newQ.groupId || null,
      };
      if (newQ.type === "PILGAN" || newQ.type === "PILGAN_KOMPLEK") {
        payload.options = newQ.options
          .map((text, i) => toOptionPayload(text, newQ.optionImages[i]))
          .filter((o) => optionText(o));
      }
      if (newQ.type === "BENAR_SALAH") {
        payload.options = ["Benar", "Salah"];
      }
      const res = await fetch(`/api/guru/ujian/${exam.id}/questions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Gagal"); return; }
      const q = await res.json();
      setExam((p) => ({ ...p, questions: [...p.questions, q] }));
      setNewQ({ type: "PILGAN", content: "", contentImageUrl: "", audioUrl: "", videoUrl: "", options: ["", "", "", ""], optionImages: ["", "", "", ""], correctAnswer: "", explanation: "", score: "1", difficulty: "2", sectionId: "", groupId: "" });
      setShowForm(false);
    });
  }

  async function handleDeleteQuestion(qId: string) {
    if (!confirm("Hapus soal ini?")) return;
    await fetch(`/api/guru/ujian/${exam.id}/questions`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: qId }),
    });
    setExam((p) => ({ ...p, questions: p.questions.filter((q) => q.id !== qId) }));
  }

  async function handleAssignQuestion(qId: string, field: "sectionId" | "groupId", value: string) {
    const res = await fetch(`/api/guru/ujian/${exam.id}/questions`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: qId, [field]: value || null }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Gagal memperbarui asosiasi soal");
      return;
    }
    const updated = await res.json();
    setExam((p) => ({ ...p, questions: p.questions.map((q) => q.id === qId ? { ...q, sectionId: updated.sectionId ?? null, groupId: updated.groupId ?? null } : q) }));
  }

  const uniqueStudents = new Set(attempts.map((a) => a.student.name)).size;
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length)
    : null;
  const bestByStudent = new Map<string, number>();
  for (const a of attempts) {
    const prev = bestByStudent.get(a.student.name);
    if (prev === undefined || (a.score ?? 0) > prev) bestByStudent.set(a.student.name, a.score ?? 0);
  }
  const passCountUnique = [...bestByStudent.values()].filter((s) => s >= exam.passingScore).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-4 flex-1 text-sm text-gray-600">
          <span><strong>{exam.duration}</strong> menit</span>
          <span>Lulus <strong>{exam.passingScore}%</strong></span>
          <span><strong>{exam.questions.length}</strong> soal</span>
          <span><strong>{exam._count.attempts}</strong> pengerjaan</span>
          {exam.isRandomized && <span className="text-indigo-600">Acak soal</span>}
        </div>
        <button onClick={handleTogglePublish}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            exam.isPublished
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}>
          {exam.isPublished ? <><EyeOff className="h-4 w-4" />Sembunyikan</> : <><Eye className="h-4 w-4" />Publikasikan</>}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {exam.classId != null && materials.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookMarked className="h-4 w-4 text-indigo-500" />
            <span className="font-medium">Lampiran ke Materi:</span>
            {exam.material ? (
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {exam.material.chapterTitle ? `Bab: ${exam.material.chapterTitle} — ` : ""}{exam.material.title}
              </span>
            ) : (
              <span className="text-xs text-gray-400">belum dilampirkan</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={materialInput}
              onChange={(e) => setMaterialInput(e.target.value)}
              aria-label="Lampirkan ujian ke materi"
              className="max-w-[240px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— Tidak terlampir —</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.chapterTitle ? `Bab: ${m.chapterTitle} — ` : ""}{m.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveMaterial}
              disabled={isPending || materialInput === (exam.materialId ?? "")}
              className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {(["soal", "toefl", "hasil", "essay"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); if (t === "soal") loadToefl(); }}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "soal" ? `Soal (${exam.questions.length})` : t === "toefl" ? "TOEFL" : t === "essay" ? "Nilai Essay" : `Hasil Ujian (${attempts.length})`}
          </button>
        ))}
      </div>

      {tab === "soal" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowPickBank(true)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              <BookMarked className="h-4 w-4" /> Pilih dari Bank Soal
            </button>
          </div>
          {toeflSections.length > 0 && exam.questions.some((q) => !q.sectionId) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Ada {exam.questions.filter((q) => !q.sectionId).length} soal tanpa section. Soal tanpa section tidak akan tampil ke siswa pada ujian TOEFL — assign ke section di bawah ini.
            </div>
          )}
          {exam.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">{q.type}</span>
                    <span className={`text-xs font-medium ${DIFF_COLOR[q.difficulty] ?? "text-gray-500"}`}>
                      {DIFF_LABEL[q.difficulty] ?? ""}
                    </span>
                    {q.sectionId && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">§ {toeflSections.find((s) => s.id === q.sectionId)?.name ?? "Section"}</span>
                    )}
                    {q.groupId && (
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">◈ {toeflGroups.find((g) => g.id === q.groupId)?.title ?? "Group"}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-500">{q.score} poin</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap"><MathRenderer content={q.content} /></div>
                  {q.options && (
                    <div className="mt-2 grid gap-1">
                      {normalizeOptions(q.options).map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                          opt.text === q.correctAnswer ? "bg-green-50 text-green-700 font-medium" : "bg-gray-50 text-gray-600"
                        }`}>
                          <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                          <span>{opt.text}</span>
                          {opt.imageUrl && <img src={opt.imageUrl} alt="" className="ml-2 h-10 w-10 rounded object-cover" />}
                          {opt.text === q.correctAnswer && <CheckCircle className="h-3.5 w-3.5 ml-auto" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.correctAnswer && q.type !== "PILGAN" && (
                    <p className="mt-2 text-xs text-green-600">Jawaban: {q.correctAnswer}</p>
                  )}
                  {q.explanation && <p className="mt-1.5 text-xs italic text-gray-500">Penjelasan: {q.explanation}</p>}
                  {(toeflSections.length > 0 || toeflGroups.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {toeflSections.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-500">
                          Section:
                          <select
                            value={q.sectionId ?? ""}
                            onChange={(e) => handleAssignQuestion(q.id, "sectionId", e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                          >
                            <option value="">— tanpa section —</option>
                            {toeflSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </label>
                      )}
                      {toeflGroups.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-500">
                          Group:
                          <select
                            value={q.groupId ?? ""}
                            onChange={(e) => handleAssignQuestion(q.id, "groupId", e.target.value)}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                          >
                            <option value="">— tanpa group —</option>
                            {toeflGroups.map((g) => <option key={g.id} value={g.id}>{g.title ?? g.type}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDeleteQuestion(q.id)}
                  title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
              <Plus className="h-4 w-4" /> Tambah Soal
            </button>
          ) : (
            <form onSubmit={handleAddQuestion} className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Soal Baru</h3>
              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tipe</label>
                  <select value={newQ.type} onChange={(e) => setNewQ((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
                    <option value="PILGAN">Pilihan Ganda</option>
                    <option value="PILGAN_KOMPLEK">Pilihan Ganda Kompleks</option>
                    <option value="BENAR_SALAH">Benar/Salah</option>
                    <option value="MENJODOHKAN">Menjodohkan</option>
                    <option value="MENGURUTKAN">Mengurutkan</option>
                    <option value="SETUJU_TIDAK">Setuju/Tidak</option>
                    <option value="ESSAY">Esai</option>
                    <option value="ISIAN">Isian Singkat</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Poin</label>
                  <input type="number" min={1} value={newQ.score}
                    onChange={(e) => setNewQ((p) => ({ ...p, score: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kesulitan</label>
                  <select value={newQ.difficulty} onChange={(e) => setNewQ((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
                    <option value="1">Mudah</option>
                    <option value="2">Sedang</option>
                    <option value="3">Sulit</option>
                    <option value="4">Sangat Sulit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Isi Soal *</label>
                <div className="flex gap-3">
                  <textarea required rows={3} value={newQ.content}
                    onChange={(e) => setNewQ((p) => ({ ...p, content: e.target.value }))}
                    placeholder="Tulis pertanyaan di sini..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                  <ImageUploadButton
                    url={newQ.contentImageUrl}
                    onChange={(url) => setNewQ((p) => ({ ...p, contentImageUrl: url }))}
                    label="Gambar soal"
                    size="md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Audio Soal (opsional)</label>
                  <input type="url" value={newQ.audioUrl}
                    onChange={(e) => setNewQ((p) => ({ ...p, audioUrl: e.target.value }))}
                    placeholder="URL audio (mp3, wav)..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Video Soal (opsional)</label>
                  <input type="url" value={newQ.videoUrl}
                    onChange={(e) => setNewQ((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="URL video (mp4, youtube)..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>

              {(newQ.type === "PILGAN" || newQ.type === "PILGAN_KOMPLEK") && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Pilihan Jawaban</label>
                  {newQ.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                      <input value={opt} onChange={(e) => updateOpt(i, e.target.value)}
                        placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none" />
                      <ImageUploadButton
                        url={newQ.optionImages[i]}
                        onChange={(url) => updateOptImage(i, url)}
                        label={`Gambar pilihan ${String.fromCharCode(65 + i)}`}
                      />
                      {newQ.type === "PILGAN" && (
                        <input type="radio" name="correct" checked={newQ.correctAnswer === opt && opt !== ""}
                          onChange={() => setNewQ((p) => ({ ...p, correctAnswer: opt }))}
                          title="Tandai jawaban benar" />
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">Klik radio di kanan untuk menandai jawaban benar</p>
                </div>
              )}

              {newQ.type !== "PILGAN" && newQ.type !== "PILGAN_KOMPLEK" && newQ.type !== "ESSAY" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Kunci Jawaban</label>
                  <input value={newQ.correctAnswer}
                    onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    placeholder={newQ.type === "TRUE_FALSE" ? "TRUE atau FALSE" : "Jawaban model..."}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Penjelasan (opsional)</label>
                <input value={newQ.explanation}
                  onChange={(e) => setNewQ((p) => ({ ...p, explanation: e.target.value }))}
                  placeholder="Penjelasan jawaban..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
              </div>

              {(toeflSections.length > 0 || toeflGroups.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {toeflSections.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Section TOEFL (opsional)</label>
                      <select value={newQ.sectionId}
                        onChange={(e) => setNewQ((p) => ({ ...p, sectionId: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
                        <option value="">— tanpa section —</option>
                        {toeflSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}
                  {toeflGroups.length > 0 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Group Stimulus (opsional)</label>
                      <select value={newQ.groupId}
                        onChange={(e) => setNewQ((p) => ({ ...p, groupId: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none">
                        <option value="">— tanpa group —</option>
                        {toeflGroups.map((g) => <option key={g.id} value={g.id}>{g.title ?? g.type}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Tambah Soal
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "essay" && (
        <EssayGradingClient exam={exam} essayQuestions={essayQuestions} attempts={essayAttempts} />
      )}

      {tab === "toefl" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <ToeflExamEditor examId={exam.id} />
        </div>
      )}

      {tab === "hasil" && (
        <div className="space-y-4">
          {attempts.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Peserta", value: uniqueStudents },
                { label: "Rata-rata", value: avgScore !== null ? `${avgScore}%` : "—" },
                { label: "Lulus (terbaik)", value: `${passCountUnique} / ${uniqueStudents}` },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {attempts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-gray-500">Belum ada siswa yang mengerjakan ujian ini.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Siswa</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Nilai</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.student.name}
                        {(a.attemptNumber ?? 1) > 1 && (
                          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">Percobaan #{a.attemptNumber}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-900">{a.score ?? "—"}%</td>
                      <td className="px-4 py-3 text-center">
                        {a.score !== null && (
                          (a.score >= exam.passingScore)
                            ? <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium"><CheckCircle className="h-3.5 w-3.5" />Lulus</span>
                            : <span className="flex items-center justify-center gap-1 text-red-500 text-xs font-medium"><XCircle className="h-3.5 w-3.5" />Tidak Lulus</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showPickBank && (
        <PickFromBankModal
          examId={exam.id}
          subjects={subjects}
          onClose={() => setShowPickBank(false)}
          onPicked={() => { setShowPickBank(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
