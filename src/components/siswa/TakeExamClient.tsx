"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface Question { id: string; type: string; content: string; options: string[] | null; score: number }
interface Exam {
  id: string; title: string; duration: number; passingScore: number;
  description: string | null; isRandomized: boolean;
  class: { name: string; subject: { name: string; color: string } };
  questions: Question[];
}
interface Attempt { id: string; score: number | null; isCompleted: boolean; answers: Record<string, string> | null }

export default function TakeExamClient({ exam, existingAttempt }: { exam: Exam; existingAttempt: Attempt | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>(existingAttempt?.answers ?? {});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [submitted, setSubmitted] = useState(existingAttempt?.isCompleted ?? false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    existingAttempt?.isCompleted ? { score: existingAttempt.score ?? 0, passed: (existingAttempt.score ?? 0) >= exam.passingScore } : null
  );

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      const res = await fetch(`/api/siswa/ujian/${exam.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ score: data.score, passed: data.passed });
        setSubmitted(true);
        router.refresh();
      }
    });
  }, [answers, exam.id, router]);

  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, handleSubmit]);

  const q = exam.questions[current];
  const answered = Object.keys(answers).length;
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");
  const isLow = timeLeft < 120;

  if (submitted && result) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
          {result.passed
            ? <CheckCircle className="h-12 w-12 text-green-600" />
            : <XCircle className="h-12 w-12 text-red-500" />
          }
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{result.passed ? "Selamat, Kamu Lulus!" : "Belum Lulus"}</h2>
          <p className="mt-1 text-gray-500">{exam.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Nilai", value: `${result.score}%` },
            { label: "KKM", value: `${exam.passingScore}%` },
            { label: "Soal", value: `${answered} / ${exam.questions.length}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <Link href="/siswa/ujian" className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
          Kembali ke Daftar Ujian
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div>
          <p className="text-xs text-gray-400">{exam.class.subject.name} · {exam.class.name}</p>
          <p className="font-semibold text-gray-900 text-sm">{exam.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{answered}/{exam.questions.length} dijawab</span>
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${isLow ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"}`}>
            <Clock className="h-4 w-4" />
            {mm}:{ss}
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-white p-4">
        {exam.questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
              i === current ? "bg-indigo-600 text-white" :
              answers[exam.questions[i].id] ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">Soal {current + 1} dari {exam.questions.length}</span>
          <span className="text-xs text-gray-400">{q.score} poin</span>
        </div>

        <p className="text-base text-gray-900 whitespace-pre-wrap">{q.content}</p>

        {q.type === "PILGAN" && q.options && (
          <div className="space-y-2">
            {(q.options as string[]).map((opt, i) => (
              <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                answers[q.id] === opt ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                  answers[q.id] === opt ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                }`}>
                  {answers[q.id] === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <input type="radio" className="sr-only" name={q.id} value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} />
                <span className="text-sm text-gray-800">{String.fromCharCode(65 + i)}. {opt}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === "TRUE_FALSE" && (
          <div className="flex gap-3">
            {["TRUE", "FALSE"].map((val) => (
              <label key={val} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                answers[q.id] === val ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}>
                <input type="radio" className="sr-only" name={q.id} value={val}
                  onChange={() => setAnswers((p) => ({ ...p, [q.id]: val }))} />
                {val === "TRUE" ? "✓ Benar" : "✗ Salah"}
              </label>
            ))}
          </div>
        )}

        {q.type === "ESSAY" && (
          <textarea rows={4} value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            placeholder="Tulis jawaban kamu di sini..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Sebelumnya
        </button>

        {current < exam.questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => Math.min(exam.questions.length - 1, c + 1))}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Selanjutnya <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Kumpulkan Ujian
          </button>
        )}
      </div>
    </div>
  );
}
