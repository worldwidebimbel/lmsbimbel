"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface EssayQuestion { id: string; content: string; score: number }
interface EssayAttempt {
  id: string;
  studentId: string;
  studentName: string;
  score: number | null;
  answers: Record<string, string> | null;
  submittedAt: string;
}
interface ExamInfo { id: string; title: string; passingScore: number }

export default function EssayGradingClient({
  exam,
  essayQuestions,
  attempts,
}: {
  exam: ExamInfo;
  essayQuestions: EssayQuestion[];
  attempts: EssayAttempt[];
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});

  if (essayQuestions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Tidak ada soal essay pada ujian ini.
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        Belum ada siswa yang mengerjakan ujian ini.
      </div>
    );
  }

  function getScore(attemptId: string, qId: string): string {
    const v = scores[attemptId]?.[qId];
    if (v !== undefined) return String(v);
    return "";
  }

  function setScore(attemptId: string, qId: string, value: string) {
    const num = value === "" ? 0 : Math.max(0, Number(value));
    setScores((p) => ({
      ...p,
      [attemptId]: { ...(p[attemptId] ?? {}), [qId]: num },
    }));
  }

  function handleSave(attemptId: string) {
    const essayScores = scores[attemptId];
    if (!essayScores || Object.keys(essayScores).length === 0) {
      toast.error("Belum ada nilai yang diinput");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/guru/ujian/${exam.id}/essay-grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, essayScores }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Nilai disimpan: ${data.score}%`);
        setExpanded(null);
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Gagal menyimpan nilai");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        Total {essayQuestions.length} soal essay · {attempts.length} siswa mengerjakan
      </div>
      {attempts.map((a) => (
        <div key={a.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expanded === a.id ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
              <span className="font-medium text-gray-900">{a.studentName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Nilai: <strong className={a.score !== null && a.score >= exam.passingScore ? "text-green-600" : "text-gray-900"}>{a.score ?? "—"}%</strong>
              </span>
              <span className="text-xs text-gray-400">{new Date(a.submittedAt).toLocaleDateString("id-ID")}</span>
            </div>
          </button>
          {expanded === a.id && (
            <div className="border-t border-gray-100 p-4 space-y-4">
              {essayQuestions.map((q, i) => {
                const answer = a.answers?.[q.id] ?? "(tidak dijawab)";
                return (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-700">Soal {i + 1}</p>
                      <span className="text-xs text-gray-400">Max: {q.score} poin</span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{q.content}</p>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Jawaban siswa:</p>
                      <p className="text-sm text-gray-800 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">{answer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-600">Nilai:</label>
                      <input
                        type="number"
                        min={0}
                        max={q.score}
                        step="0.5"
                        value={getScore(a.id, q.id)}
                        onChange={(e) => setScore(a.id, q.id, e.target.value)}
                        placeholder={`0 - ${q.score}`}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-xs text-gray-400">/ {q.score}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleSave(a.id)}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Nilai Essay
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
