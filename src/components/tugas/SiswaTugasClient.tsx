"use client";

import { useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ClipboardList, Clock, CheckCircle, AlertCircle,
  ExternalLink, Loader2, X, Send,
} from "lucide-react";
import { AssignmentItem, SubmissionItem } from "./types";

interface SiswaTugasClientProps {
  studentId: string;
  initialAssignments: AssignmentItem[];
}

type Tab = "semua" | "belum" | "selesai";

export default function SiswaTugasClient({ initialAssignments }: SiswaTugasClientProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [tab, setTab] = useState<Tab>("semua");
  const [submitModal, setSubmitModal] = useState<AssignmentItem | null>(null);
  const [submitForm, setSubmitForm] = useState({ content: "", fileUrl: "" });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const getSubmission = (a: AssignmentItem): SubmissionItem | undefined => a.submissions?.[0];

  const filtered = assignments.filter((a) => {
    const sub = getSubmission(a);
    if (tab === "belum") return !sub;
    if (tab === "selesai") return !!sub;
    return true;
  });

  const counts = {
    semua: assignments.length,
    belum: assignments.filter((a) => !getSubmission(a)).length,
    selesai: assignments.filter((a) => !!getSubmission(a)).length,
  };

  function openSubmit(a: AssignmentItem) {
    const sub = getSubmission(a);
    setSubmitModal(a);
    setSubmitForm({ content: sub?.content ?? "", fileUrl: sub?.fileUrl ?? "" });
    setError("");
  }

  function handleSubmit() {
    if (!submitModal) return;
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tugas/${submitModal.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitForm),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Gagal mengumpulkan");
          return;
        }
        const newSub: SubmissionItem = await res.json();
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === submitModal.id ? { ...a, submissions: [newSub] } : a
          )
        );
        setSubmitModal(null);
      } catch {
        setError("Terjadi kesalahan jaringan");
      }
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "belum", label: "Belum Dikumpulkan" },
    { key: "selesai", label: "Sudah Dikumpulkan" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <ClipboardList className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">
            {tab === "belum" ? "Semua tugas sudah dikumpulkan! 🎉" : "Belum ada tugas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const sub = getSubmission(assignment);
            const overdue = isPast(new Date(assignment.dueDate));
            const isSubmitted = !!sub;
            const isGraded = sub?.score !== null && sub?.score !== undefined;

            return (
              <div
                key={assignment.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${isSubmitted ? "border-green-200" : overdue ? "border-red-200" : "border-gray-200"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${isSubmitted ? "bg-green-100" : overdue ? "bg-red-100" : "bg-blue-100"}`}>
                    {isSubmitted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : overdue ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                        <p className="text-xs text-gray-500">{assignment.class?.name} · {assignment.teacher?.name}</p>
                      </div>
                      {isGraded && (
                        <span className="flex-shrink-0 text-lg font-bold text-green-600">
                          {sub!.score} <span className="text-sm font-normal text-gray-400">/ {assignment.maxScore}</span>
                        </span>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className={`flex items-center gap-1 ${overdue && !isSubmitted ? "text-red-600 font-medium" : ""}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {overdue ? "Lewat: " : "Deadline: "}
                        {format(new Date(assignment.dueDate), "d MMM yyyy, HH:mm", { locale: localeId })}
                      </span>
                    </div>

                    {sub && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                        {sub.content && <p className="text-gray-700 line-clamp-2">{sub.content}</p>}
                        {sub.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline">
                            <ExternalLink className="h-3.5 w-3.5" /> File jawaban
                          </a>
                        )}
                        {sub.feedback && (
                          <p className="mt-2 italic text-blue-700">💬 {sub.feedback}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          Dikumpulkan: {format(new Date(sub.submittedAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {assignment.fileUrl && (
                        <a
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          File Soal
                        </a>
                      )}
                      {!overdue || isSubmitted ? (
                        <button
                          onClick={() => openSubmit(assignment)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${isSubmitted ? "border border-blue-300 text-blue-700 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isSubmitted ? "Edit Jawaban" : "Kumpulkan"}
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Deadline terlewat</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Kumpulkan Tugas</h2>
              <button onClick={() => setSubmitModal(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-medium text-gray-700">{submitModal.title}</p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jawaban / Uraian</label>
                <textarea
                  rows={4}
                  value={submitForm.content}
                  onChange={(e) => setSubmitForm((p) => ({ ...p, content: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tulis jawaban di sini..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Link File Jawaban (opsional)</label>
                <input
                  value={submitForm.fileUrl}
                  onChange={(e) => setSubmitForm((p) => ({ ...p, fileUrl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setSubmitModal(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || (!submitForm.content && !submitForm.fileUrl)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Kumpulkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
