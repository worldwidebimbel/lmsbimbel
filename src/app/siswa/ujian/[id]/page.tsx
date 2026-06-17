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
        select: { id: true, type: true, content: true, options: true, score: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!exam) notFound();

  const attempt = await db.examAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: session.user.id } },
  });

  const questions = exam.isRandomized
    ? [...exam.questions].sort(() => Math.random() - 0.5)
    : exam.questions;

  return (
    <TakeExamClient
      exam={{ ...JSON.parse(JSON.stringify(exam)), questions }}
      existingAttempt={attempt ? JSON.parse(JSON.stringify(attempt)) : null}
    />
  );
}
