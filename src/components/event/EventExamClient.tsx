"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, Send, Check, AlertCircle, Loader2 } from "lucide-react";

interface Question {
  id: string;
  type: string;
  content: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  options: unknown;
  score: number;
}

interface ExamData {
  exam: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    passingScore: number;
    questionCount: number;
  };
  questions: Question[];
  attempt: {
    isCompleted: boolean;
    score: number | null;
    submittedAt: string | null;
    attemptNumber?: number;
  } | null;
  maxAttempts?: number;
  completedAttempts?: number;
}

function MediaDisplay({ question }: { question: Question }) {
  if (!question.imageUrl && !question.audioUrl && !question.videoUrl) return null;
  return (
    <div className="mt-3 space-y-2">
      {question.imageUrl && (
        <img src={question.imageUrl} alt="Soal" className="max-w-full rounded-lg border border-gray-200" />
      )}
      {question.audioUrl && (
        <audio controls className="w-full">
          <source src={question.audioUrl} />
        </audio>
      )}
      {question.videoUrl && (
        <video controls className="max-w-full rounded-lg border border-gray-200">
          <source src={question.videoUrl} />
        </video>
      )}
    </div>
  );
}

export default function EventExamClient({ eventId, data }: { eventId: string; data: ExamData }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(data.exam.duration * 60);
  const [submitted, setSubmitted] = useState(data.attempt?.isCompleted ?? false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    data.attempt?.isCompleted && data.attempt.score !== null
      ? { score: data.attempt.score, passed: data.attempt.score >= data.exam.passingScore }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [submitted]);

  async function handleSubmit() {
    if (loading || submitted) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/events/${eventId}/exam/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ score: data.score, passed: data.passed });
      setSubmitted(true);
    } else {
      setError(data.error || "Gagal mengumpulkan ujian");
    }
    setLoading(false);
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progress = Object.keys(answers).length;
  const questions = data.questions;

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-5">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto ${result.passed ? "bg-green-100" : "bg-red-100"}`}>
            {result.passed ? (
              <Check className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{result.score}</p>
            <p className="text-sm text-gray-500">dari 100 poin</p>
          </div>
          <p className={`text-lg font-semibold ${result.passed ? "text-green-600" : "text-red-600"}`}>
            {result.passed ? "Selamat! Anda Lulus" : "Belum Mencapai Passing Score"}
          </p>
          <p className="text-sm text-gray-500">Passing score: {data.exam.passingScore}</p>
          <a
            href={`/events/${eventId}/results`}
            className="inline-block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Lihat Leaderboard
          </a>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{data.exam.title}</p>
            <p className="text-xs text-gray-500">{progress}/{questions.length} terjawab</p>
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${secondsLeft < 300 ? "text-red-600" : "text-gray-900"}`}>
            <Clock className="w-5 h-5" />
            {formatTime(secondsLeft)}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(progress / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Soal {current + 1}
            </span>
            <span className="text-xs text-gray-400">{q.score} poin</span>
          </div>
          <p className="text-gray-900 font-medium leading-relaxed">{q.content}</p>

          <MediaDisplay question={q} />

          {q.type === "PILGAN" && Array.isArray(q.options) && (
            <div className="space-y-2">
              {(q.options as unknown as string[]).map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    answers[q.id] === opt
                      ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
                      : "border-gray-200 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "ESSAY" && (
            <textarea
              rows={4}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Tulis jawaban Anda..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          )}

          {q.type === "TRUE_FALSE" && (
            <div className="flex gap-3">
              {["Benar", "Salah"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    answers[q.id] === opt
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kumpulkan
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-8 w-8 rounded-md text-xs font-medium border transition-colors ${
                answers[questions[i].id]
                  ? "bg-blue-600 text-white border-blue-600"
                  : i === current
                  ? "border-blue-400 text-blue-600"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}
