"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { normalizeOptions } from "@/lib/question-options";

interface Question { id: string; type: string; content: string; options: unknown; score: number }
interface Exam {
  id: string; title: string; duration: number; passingScore: number;
  description: string | null; isRandomized: boolean;
  class: { name: string; subject: { name: string; color: string } };
  questions: Question[];
}
interface Attempt { id: string; score: number | null; isCompleted: boolean; answers: Record<string, string> | null }

function shuffleArr<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0; }
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function TakeExamClient({ exam, existingAttempt }: { exam: Exam; existingAttempt: Attempt | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>(existingAttempt?.answers ?? {});
  // MENGURUTKAN: track current item order per question
  const [orderedQ, setOrderedQ] = useState<Record<string, { text: string; imageUrl?: string }[]>>({});
  // MENJODOHKAN: shuffled right items per question (stable)
  const shuffledRightsRef = useRef<Record<string, string[]>>({});
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

        <div className="text-base text-gray-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.content }} />

        {/* Pilihan Ganda Tunggal */}
        {q.type === "PILGAN" && Array.isArray(q.options) && (
          <div className="space-y-2">
            {normalizeOptions(q.options).map((opt, i) => (
              <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                answers[q.id] === opt.text ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${
                  answers[q.id] === opt.text ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                }`}>
                  {answers[q.id] === opt.text && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <input type="radio" className="sr-only" name={q.id} value={opt.text}
                  checked={answers[q.id] === opt.text}
                  onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt.text }))} />
                <span className="text-sm text-gray-800">{String.fromCharCode(65 + i)}. {opt.text}</span>
                {opt.imageUrl && <img src={opt.imageUrl} alt="" className="ml-auto h-12 w-12 rounded object-cover" />}
              </label>
            ))}
          </div>
        )}

        {/* Pilihan Ganda Kompleks — centang semua yang benar */}
        {q.type === "PILGAN_KOMPLEK" && Array.isArray(q.options) && (() => {
          const opts = normalizeOptions(q.options);
          const selected = answers[q.id] ? answers[q.id].split("|") : [];
          return (
            <div className="space-y-2">
              <p className="text-xs text-indigo-600 font-medium">Pilih semua jawaban yang benar (boleh lebih dari satu)</p>
              {opts.map((opt, i) => {
                const checked = selected.includes(opt.text);
                return (
                  <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    checked ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 ${
                      checked ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                    }`}>
                      {checked && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={checked}
                      onChange={() => {
                        const next = checked ? selected.filter((s) => s !== opt.text) : [...selected, opt.text];
                        setAnswers((p) => ({ ...p, [q.id]: next.sort().join("|") }));
                      }} />
                    <span className="text-sm text-gray-800">{String.fromCharCode(65 + i)}. {opt.text}</span>
                    {opt.imageUrl && <img src={opt.imageUrl} alt="" className="ml-auto h-12 w-12 rounded object-cover" />}
                  </label>
                );
              })}
            </div>
          );
        })()}

        {/* Benar / Salah */}
        {q.type === "BENAR_SALAH" && (
          <div className="flex gap-3">
            {["Benar", "Salah"].map((val) => (
              <label key={val} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                answers[q.id] === val ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}>
                <input type="radio" className="sr-only" name={q.id} value={val}
                  onChange={() => setAnswers((p) => ({ ...p, [q.id]: val }))} />
                {val === "Benar" ? "✓ Benar" : "✗ Salah"}
              </label>
            ))}
          </div>
        )}

        {/* Menjodohkan */}
        {q.type === "MENJODOHKAN" && Array.isArray(q.options) && (() => {
          const pairs = q.options as { left: string; right: string }[];
          if (!shuffledRightsRef.current[q.id]) {
            shuffledRightsRef.current[q.id] = shuffleArr(pairs.map((p) => p.right), q.id);
          }
          const rightOpts = shuffledRightsRef.current[q.id];
          const studentMap: Record<string, string> = answers[q.id]
            ? Object.fromEntries(answers[q.id].split(",").map((pair) => pair.split(":")))
            : {};
          return (
            <div className="space-y-3">
              <p className="text-xs text-indigo-600 font-medium">Pilih pasangan yang tepat untuk setiap item di kiri</p>
              {pairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800">{pair.left}</div>
                  <span className="text-gray-400 shrink-0">→</span>
                  <select
                    value={studentMap[String(i)] ?? ""}
                    onChange={(e) => {
                      const updated = { ...studentMap, [String(i)]: e.target.value };
                      setAnswers((p) => ({
                        ...p,
                        [q.id]: Object.entries(updated).map(([k, v]) => `${k}:${v}`).join(","),
                      }));
                    }}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="">— Pilih pasangan —</option>
                    {rightOpts.map((r, j) => <option key={j} value={r}>{r}</option>)}
                  </select>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Mengurutkan */}
        {q.type === "MENGURUTKAN" && Array.isArray(q.options) && (() => {
          const items = normalizeOptions(q.options);
          const itemTexts = items.map((o) => o.text);
          if (!orderedQ[q.id]) {
            const shuffled = shuffleArr(items, q.id);
            setTimeout(() => {
              setOrderedQ((prev) => prev[q.id] ? prev : { ...prev, [q.id]: shuffled });
            }, 0);
            return <div className="text-sm text-gray-400">Memuat...</div>;
          }
          const current_order = orderedQ[q.id].map((v) => normalizeOptions([v])[0]);
          function moveItem(from: number, to: number) {
            const arr = [...current_order];
            const [item] = arr.splice(from, 1);
            arr.splice(to, 0, item);
            setOrderedQ((p) => ({ ...p, [q.id]: arr }));
            setAnswers((p) => ({ ...p, [q.id]: arr.map((o) => o.text).join(",") }));
          }
          return (
            <div className="space-y-2">
              <p className="text-xs text-indigo-600 font-medium">Gunakan tombol ↑↓ untuk mengurutkan item dengan benar</p>
              {current_order.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800">
                    {item.text}
                    {item.imageUrl && <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button disabled={i === 0} onClick={() => moveItem(i, i - 1)}
                      className="rounded p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button disabled={i === current_order.length - 1} onClick={() => moveItem(i, i + 1)}
                      className="rounded p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-20">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Setuju / Tidak Setuju */}
        {q.type === "SETUJU_TIDAK" && Array.isArray(q.options) && (() => {
          const stmts = q.options as string[];
          const studentAnswers = answers[q.id] ? answers[q.id].split(",") : Array(stmts.length).fill("");
          return (
            <div className="space-y-3">
              <p className="text-xs text-indigo-600 font-medium">Tentukan setuju atau tidak setuju untuk setiap pernyataan</p>
              {stmts.map((stmt, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                  <p className="text-sm text-gray-800">{i + 1}. {stmt}</p>
                  <div className="flex gap-2">
                    {["SETUJU", "TIDAK"].map((val) => (
                      <label key={val} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 py-2 text-xs font-medium transition-all ${
                        studentAnswers[i] === val ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                        <input type="radio" className="sr-only" name={`${q.id}-${i}`} value={val}
                          onChange={() => {
                            const arr = [...studentAnswers];
                            arr[i] = val;
                            setAnswers((p) => ({ ...p, [q.id]: arr.join(",") }));
                          }} />
                        {val === "SETUJU" ? "✓ Setuju" : "✗ Tidak Setuju"}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Essay */}
        {q.type === "ESSAY" && (
          <textarea rows={4} value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            placeholder="Tulis jawaban kamu di sini..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
        )}

        {/* Isian Singkat */}
        {q.type === "ISIAN" && (
          <input value={answers[q.id] ?? ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
            placeholder="Ketik jawaban singkat..."
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
