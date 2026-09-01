"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Eye, EyeOff, Clock, FileCheck, Users, Loader2, Link2, Trash2 } from "lucide-react";
import Link from "next/link";

interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
  passingScore: number;
  maxAttempts: number;
  _count: { questions: number; attempts: number };
}

interface EventExamListClientProps {
  eventId: string;
  eventTitle: string;
  exams: ExamItem[];
  backHref: string;
}

export default function EventExamListClient({ eventId, eventTitle, exams, backHref }: EventExamListClientProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [examList, setExamList] = useState(exams);

  function togglePublish(examId: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${eventId}/exam`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, isPublished: !current }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal mengubah status");
        return;
      }
      const updated = await res.json();
      setExamList((prev) => prev.map((e) => e.id === examId ? { ...e, isPublished: updated.isPublished } : e));
    });
  }

  function unlinkExam(examId: string) {
    if (!confirm("Lepas ujian ini dari event? Soal tidak akan dihapus.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${eventId}/exam/unlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal melepas ujian");
        return;
      }
      setExamList((prev) => prev.filter((e) => e.id !== examId));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Ujian Event</h1>
          <p className="text-sm text-gray-500">{eventTitle}</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          <strong>Info:</strong> Soal ujian untuk event ini disusun oleh guru melalui halaman{" "}
          <span className="font-mono text-xs bg-blue-100 px-1.5 py-0.5 rounded">/guru/ujian</span>.
          Saat membuat ujian, guru memilih untuk mengaitkannya dengan Event ini. Ujian yang terhubung akan muncul di daftar di bawah.
        </p>
      </div>

      {examList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Link2 className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada ujian yang terhubung dengan event ini.</p>
          <p className="text-xs text-gray-400 mt-1">
            Guru dapat mengaitkan ujian ke event ini dari halaman <Link href="/guru/ujian/new" className="text-indigo-500 hover:underline">Buat Ujian</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {examList.map((exam) => (
            <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exam.isPublished
                      ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><Eye className="h-3 w-3" />Dipublikasikan</span>
                      : <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"><EyeOff className="h-3 w-3" />Draft</span>
                    }
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-gray-900">{exam.title}</h3>
                  {exam.description && <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{exam.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(exam.id, exam.isPublished)}
                    disabled={isPending}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      exam.isPublished
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {exam.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {exam.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => unlinkExam(exam.id)}
                    disabled={isPending}
                    className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                    title="Lepas dari event"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration} menit</span>
                <span className="flex items-center gap-1"><FileCheck className="h-3.5 w-3.5" />{exam._count.questions} soal</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam._count.attempts} pengerjaan</span>
                <span className="flex items-center gap-1">Maks. {exam.maxAttempts}x percobaan</span>
                <span className="flex items-center gap-1">Passing: {exam.passingScore}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
