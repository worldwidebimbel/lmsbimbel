"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Save, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  type: string;
  content: string;
  options: unknown;
  correctAnswer: string | null;
  explanation: string | null;
  score: number;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  isRandomized: boolean;
  passingScore: number;
  isPublished: boolean;
  questions: Question[];
  _count?: { attempts: number };
}

const QUESTION_TYPES = [
  { value: "PILGAN", label: "Pilihan Ganda" },
  { value: "TRUE_FALSE", label: "Benar / Salah" },
  { value: "ESSAY", label: "Esai" },
];

export default function EventExamAdminClient({
  eventId,
  eventTitle,
  initialExam,
}: {
  eventId: string;
  eventTitle: string;
  initialExam: Exam | null;
}) {
  const [exam, setExam] = useState<Exam | null>(initialExam);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    duration: 60,
    passingScore: 60,
    isRandomized: false,
    startTime: "",
    endTime: "",
  });

  const [addingQ, setAddingQ] = useState(false);
  const [newQ, setNewQ] = useState({
    type: "PILGAN",
    content: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    score: 1,
  });

  async function createExam() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/events/${eventId}/exam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newExam,
        duration: Number(newExam.duration),
        passingScore: Number(newExam.passingScore),
        startTime: newExam.startTime || null,
        endTime: newExam.endTime || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setExam({ ...data, questions: [] });
      setMsg("Ujian berhasil dibuat");
    } else {
      setMsg(data.error || "Gagal membuat ujian");
    }
    setSaving(false);
  }

  async function updateExamField(field: Partial<Exam>) {
    if (!exam) return;
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/events/${eventId}/exam`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field),
    });
    const data = await res.json();
    if (res.ok) {
      setExam((e) => (e ? { ...e, ...data } : null));
      setMsg("Tersimpan");
    } else {
      setMsg(data.error || "Gagal menyimpan");
    }
    setSaving(false);
  }

  async function addQuestion() {
    if (!exam) return;
    setSaving(true);
    setMsg("");
    const payload = {
      type: newQ.type,
      content: newQ.content,
      options: newQ.type === "PILGAN" ? newQ.options.filter(Boolean) : null,
      correctAnswer: newQ.correctAnswer || null,
      explanation: newQ.explanation || null,
      score: Number(newQ.score),
    };
    const res = await fetch(`/api/admin/events/${eventId}/exam/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setExam((e) => (e ? { ...e, questions: [...e.questions, data] } : null));
      setNewQ({ type: "PILGAN", content: "", options: ["", "", "", ""], correctAnswer: "", explanation: "", score: 1 });
      setAddingQ(false);
      setMsg("Soal ditambahkan");
    } else {
      setMsg(data.error || "Gagal menambahkan soal");
    }
    setSaving(false);
  }

  async function deleteQuestion(questionId: string) {
    if (!exam || !confirm("Hapus soal ini?")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/events/${eventId}/exam/questions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    if (res.ok) {
      setExam((e) => (e ? { ...e, questions: e.questions.filter((q) => q.id !== questionId) } : null));
      setMsg("Soal dihapus");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ujian Event</h1>
          <p className="text-sm text-gray-500">{eventTitle}</p>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">{msg}</div>
      )}

      {!exam ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Buat Ujian Baru</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Ujian</label>
              <input
                value={newExam.title}
                onChange={(e) => setNewExam((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Contoh: Tryout Matematika Sesi 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                <input
                  type="number"
                  value={newExam.duration}
                  onChange={(e) => setNewExam((p) => ({ ...p, duration: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score</label>
                <input
                  type="number"
                  value={newExam.passingScore}
                  onChange={(e) => setNewExam((p) => ({ ...p, passingScore: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Ujian</label>
                <input
                  type="datetime-local"
                  value={newExam.startTime}
                  onChange={(e) => setNewExam((p) => ({ ...p, startTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutup Ujian</label>
                <input
                  type="datetime-local"
                  value={newExam.endTime}
                  onChange={(e) => setNewExam((p) => ({ ...p, endTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newExam.isRandomized}
                onChange={(e) => setNewExam((p) => ({ ...p, isRandomized: e.target.checked }))}
                className="rounded"
              />
              Acak urutan soal
            </label>
          </div>
          <button
            onClick={createExam}
            disabled={saving || !newExam.title}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Buat Ujian
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{exam.title}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {exam.isPublished ? "Dipublikasi" : "Draft"}
                </span>
                <button
                  onClick={() => updateExamField({ isPublished: !exam.isPublished })}
                  className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  title={exam.isPublished ? "Sembunyikan" : "Publikasikan"}
                >
                  {exam.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {exam.isPublished ? "Sembunyikan" : "Publikasikan"}
                </button>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <span>{exam.duration} menit</span>
              <span>Passing: {exam.passingScore}</span>
              <span>{exam.questions.length} soal</span>
              {exam._count && <span>{exam._count.attempts} pengerjaan</span>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bank Soal ({exam.questions.length})</h3>
              <button
                onClick={() => setAddingQ(true)}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" /> Tambah Soal
              </button>
            </div>

            {exam.questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-400">#{idx + 1}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{q.type}</span>
                      <span className="text-xs text-gray-400">{q.score} poin</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{q.content}</p>
                    {Array.isArray(q.options) && (
                      <ul className="mt-1.5 space-y-0.5">
                        {(q.options as string[]).map((opt, i) => (
                          <li key={i} className={`text-xs ${q.correctAnswer === opt ? "text-green-600 font-medium" : "text-gray-500"}`}>
                            {String.fromCharCode(65 + i)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.correctAnswer && q.type !== "PILGAN" && (
                      <p className="text-xs text-green-600 mt-1">Jawaban: {q.correctAnswer}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {exam.questions.length === 0 && !addingQ && (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                Belum ada soal. Klik &ldquo;Tambah Soal&rdquo; untuk mulai membuat soal.
              </div>
            )}
          </div>

          {addingQ && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
              <h4 className="font-semibold text-gray-900">Tambah Soal Baru</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                  <select
                    value={newQ.type}
                    onChange={(e) => setNewQ((p) => ({ ...p, type: e.target.value, options: ["", "", "", ""], correctAnswer: "" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poin</label>
                  <input
                    type="number"
                    value={newQ.score}
                    onChange={(e) => setNewQ((p) => ({ ...p, score: Number(e.target.value) }))}
                    min={1}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                <textarea
                  rows={3}
                  value={newQ.content}
                  onChange={(e) => setNewQ((p) => ({ ...p, content: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Tulis pertanyaan di sini..."
                />
              </div>

              {newQ.type === "PILGAN" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilihan Jawaban</label>
                  <div className="space-y-2">
                    {newQ.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500 w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <input
                          value={opt}
                          onChange={(e) => {
                            const opts = [...newQ.options];
                            opts[i] = e.target.value;
                            setNewQ((p) => ({ ...p, options: opts }));
                          }}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                          placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                        />
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQ.correctAnswer === opt}
                          onChange={() => setNewQ((p) => ({ ...p, correctAnswer: opt }))}
                          className="shrink-0"
                          title="Pilih sebagai jawaban benar"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Centang radio di kanan untuk menandai jawaban benar</p>
                  </div>
                </div>
              )}

              {newQ.type === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jawaban Benar</label>
                  <select
                    value={newQ.correctAnswer}
                    onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- pilih --</option>
                    <option value="Benar">Benar</option>
                    <option value="Salah">Salah</option>
                  </select>
                </div>
              )}

              {newQ.type === "ESSAY" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban (opsional)</label>
                  <input
                    value={newQ.correctAnswer}
                    onChange={(e) => setNewQ((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Jawaban referensi untuk penilaian manual"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penjelasan (opsional)</label>
                <input
                  value={newQ.explanation}
                  onChange={(e) => setNewQ((p) => ({ ...p, explanation: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Penjelasan pembahasan soal"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addQuestion}
                  disabled={saving || !newQ.content}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Simpan Soal
                </button>
                <button
                  onClick={() => setAddingQ(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
