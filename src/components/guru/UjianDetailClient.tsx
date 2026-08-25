"use client";

import { useState, useEffect, useTransition } from "react";
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
  correctAnswer: string | null; explanation: string | null; score: number; difficulty: number;
}
interface Attempt { id: string; student: { name: string }; score: number | null; submittedAt: string | null }
interface Exam {
  id: string; title: string; duration: number; passingScore: number;
  isPublished: boolean; isRandomized: boolean; description: string | null;
  questions: Question[]; _count: { attempts: number };
}

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

export default function UjianDetailClient({ exam: initial, attempts, subjects = [], essayQuestions = [], essayAttempts = [] }: { exam: Exam; attempts: Attempt[]; subjects?: Subject[]; essayQuestions?: EssayQuestion[]; essayAttempts?: EssayAttempt[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [exam, setExam] = useState(initial);
  useEffect(() => { setExam(initial); }, [initial]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"soal" | "hasil" | "toefl" | "essay">("soal");
  const [showPickBank, setShowPickBank] = useState(false);
  const [error, setError] = useState("");
  const [newQ, setNewQ] = useState({
    type: "PILGAN", content: "", contentImageUrl: "",
    audioUrl: "", videoUrl: "",
    options: ["", "", "", ""], optionImages: ["", "", "", ""],
    correctAnswer: "", explanation: "", score: "1", difficulty: "2",
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
      setNewQ({ type: "PILGAN", content: "", contentImageUrl: "", audioUrl: "", videoUrl: "", options: ["", "", "", ""], optionImages: ["", "", "", ""], correctAnswer: "", explanation: "", score: "1", difficulty: "2" });
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

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length)
    : null;
  const passCount = attempts.filter((a) => (a.score ?? 0) >= exam.passingScore).length;

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

      <div className="flex border-b border-gray-200">
        {(["soal", "toefl", "hasil", "essay"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
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
          {exam.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">{q.type}</span>
                    <span className={`text-xs font-medium ${DIFF_COLOR[q.difficulty] ?? "text-gray-500"}`}>
                      {DIFF_LABEL[q.difficulty] ?? ""}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">{q.score} poin</span>
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
                  {q.explanation && <p className="mt-1.5 text-xs italic text-gray-400">Penjelasan: {q.explanation}</p>}
                </div>
                <button onClick={() => handleDeleteQuestion(q.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
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
                      <span className="w-5 text-xs font-bold text-gray-400">{String.fromCharCode(65 + i)}.</span>
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
                  <p className="text-xs text-gray-400">Klik radio di kanan untuk menandai jawaban benar</p>
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
                { label: "Peserta", value: attempts.length },
                { label: "Rata-rata", value: avgScore !== null ? `${avgScore}%` : "—" },
                { label: "Lulus", value: `${passCount} / ${attempts.length}` },
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
              <p className="text-sm text-gray-400">Belum ada siswa yang mengerjakan ujian ini.</p>
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
                      <td className="px-4 py-3 font-medium text-gray-900">{a.student.name}</td>
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
