import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canStudentAccessExam } from "@/lib/exam-access";
import TakeExamClient from "@/components/siswa/TakeExamClient";

export const metadata = { title: "Kerjakan Ujian" };

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id, isPublished: true },
    include: {
      class: { select: { name: true, subject: { select: { name: true, color: true } } } },
      questions: {
        select: { id: true, type: true, content: true, imageUrl: true, audioUrl: true, videoUrl: true, options: true, score: true, groupId: true, sectionId: true, order: true },
        orderBy: { order: "asc" },
      },
      sections: { orderBy: { order: "asc" } },
      questionGroups: { orderBy: { order: "asc" } },
    },
  });

  if (!exam) notFound();

  const canAccess = await canStudentAccessExam(exam, session.user.id);
  if (!canAccess) notFound();

  const attempts = await db.examAttempt.findMany({
    where: { examId: id, studentId: session.user.id },
    orderBy: { attemptNumber: "desc" },
  });
  const latestAttempt = attempts[0] ?? null;

  const now = new Date();
  const notYetOpen = exam.startTime && new Date(exam.startTime) > now;
  const isClosed = exam.endTime && new Date(exam.endTime) < now;

  if (notYetOpen || isClosed) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-lg font-bold text-gray-900">{exam.title}</h1>
        <p className="text-sm text-amber-800">
          {notYetOpen
            ? `Ujian belum dimulai. Jadwal mulai: ${new Date(exam.startTime!).toLocaleString("id-ID")}`
            : "Waktu pengerjaan ujian ini sudah berakhir."}
        </p>
        <Link href="/siswa/ujian" className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Kembali ke Daftar Ujian
        </Link>
      </div>
    );
  }

  const questions = exam.isRandomized
    ? [...exam.questions].sort(() => Math.random() - 0.5)
    : exam.questions;

  return (
    <TakeExamClient
      exam={{ ...JSON.parse(JSON.stringify(exam)), questions }}
      existingAttempt={latestAttempt ? JSON.parse(JSON.stringify(latestAttempt)) : null}
      maxAttempts={exam.maxAttempts}
      completedAttempts={attempts.filter((a) => a.isCompleted).length}
    />
  );
}
