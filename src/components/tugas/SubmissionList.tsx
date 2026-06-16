"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle, Clock, ExternalLink, Loader2, User } from "lucide-react";
import { SubmissionItem } from "./types";
import Image from "next/image";

interface SubmissionListProps {
  assignmentId: string;
  maxScore: number;
  initialSubmissions: SubmissionItem[];
}

export default function SubmissionList({ assignmentId, maxScore, initialSubmissions }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<{ score: string; feedback: string }>({ score: "", feedback: "" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function openGrade(sub: SubmissionItem) {
    setGradingId(sub.id);
    setGradeForm({ score: sub.score?.toString() ?? "", feedback: sub.feedback ?? "" });
    setError("");
  }

  function handleGrade(subId: string) {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tugas/${assignmentId}/submissions/${subId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: Number(gradeForm.score), feedback: gradeForm.feedback }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Gagal menyimpan nilai");
          return;
        }
        const updated: SubmissionItem = await res.json();
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setGradingId(null);
      } catch {
        setError("Terjadi kesalahan jaringan");
      }
    });
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <Clock className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">Belum ada siswa yang mengumpulkan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">Daftar Submission ({submissions.length})</h2>
      {submissions.map((sub) => (
        <div key={sub.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 overflow-hidden">
              {sub.student?.avatar ? (
                <Image src={sub.student.avatar} alt={sub.student.name ?? ""} width={36} height={36} className="rounded-full" />
              ) : (
                <User className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{sub.student?.name ?? "Siswa"}</p>
                {sub.score !== null ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {sub.score} / {maxScore}
                  </span>
                ) : (
                  <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded-full">Belum dinilai</span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-gray-500">
                Dikumpulkan: {format(new Date(sub.submittedAt), "d MMM yyyy, HH:mm", { locale: localeId })}
              </p>

              {sub.content && (
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{sub.content}</p>
              )}

              {sub.fileUrl && (
                <a
                  href={sub.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka File Jawaban
                </a>
              )}

              {sub.feedback && gradingId !== sub.id && (
                <p className="mt-2 text-sm text-gray-600 italic bg-blue-50 rounded-lg px-3 py-2">
                  💬 {sub.feedback}
                </p>
              )}

              {gradingId === sub.id ? (
                <div className="mt-3 space-y-2">
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Nilai (maks {maxScore}):</label>
                    <input
                      type="number"
                      min={0}
                      max={maxScore}
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm((p) => ({ ...p, feedback: e.target.value }))}
                    placeholder="Feedback (opsional)..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGrade(sub.id)}
                      disabled={isPending || !gradeForm.score}
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Simpan Nilai
                    </button>
                    <button
                      onClick={() => setGradingId(null)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openGrade(sub)}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  {sub.score !== null ? "Edit Nilai" : "Beri Nilai"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
