import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileCheck } from "lucide-react";
import UjianDetailClient from "@/components/guru/UjianDetailClient";

export const metadata = { title: "Kelola Ujian" };

export default async function UjianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/guru");

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } },
      event: { select: { id: true, title: true, type: true } },
      material: { select: { id: true, title: true, chapterTitle: true } },
      questions: {
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, content: true, imageUrl: true, audioUrl: true, videoUrl: true, options: true, correctAnswer: true, explanation: true, score: true, difficulty: true, sectionId: true, groupId: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!exam) notFound();

  const materials = exam.class
    ? await db.material.findMany({
        where: { classId: exam.class.id },
        select: { id: true, title: true, chapterTitle: true },
        orderBy: [{ chapterOrder: "asc" }, { order: "asc" }],
      })
    : [];

  const attempts = await db.examAttempt.findMany({
    where: { examId: id, isCompleted: true },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const subjects = await db.subject.findMany({
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  const essayQuestions = exam.questions.filter((q) => q.type === "ESSAY").map((q) => ({ id: q.id, content: q.content, score: q.score }));
  const essayAttempts = attempts.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    studentName: a.student.name,
    score: a.score,
    answers: a.answers as Record<string, string> | null,
    submittedAt: a.submittedAt,
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/guru/ujian" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <FileCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-sm text-gray-500">{exam.class ? `${exam.class?.subject.name} - ${exam.class?.name}` : exam.event ? `🏆 ${exam.event.type} - ${exam.event.title}` : "Ujian mandiri"}</p>
        </div>
      </div>

      <UjianDetailClient
        exam={JSON.parse(JSON.stringify(exam))}
        attempts={JSON.parse(JSON.stringify(attempts))}
        subjects={JSON.parse(JSON.stringify(subjects))}
        materials={JSON.parse(JSON.stringify(materials))}
        essayQuestions={JSON.parse(JSON.stringify(essayQuestions))}
        essayAttempts={JSON.parse(JSON.stringify(essayAttempts))}
      />
    </div>
  );
}
