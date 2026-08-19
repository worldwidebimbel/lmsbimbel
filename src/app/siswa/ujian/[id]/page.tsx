import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
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

  const attempts = await db.examAttempt.findMany({
    where: { examId: id, studentId: session.user.id },
    orderBy: { attemptNumber: "desc" },
  });
  const latestAttempt = attempts[0] ?? null;

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
