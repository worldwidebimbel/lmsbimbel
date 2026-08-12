import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EventExamClient from "@/components/event/EventExamClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ujian Event" };

export default async function EventExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?next=/events/${id}/exam`);

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (!registration) redirect(`/events/${id}`);

  const exam = await db.exam.findFirst({
    where: { eventId: id, isPublished: true },
    include: {
      questions: {
        select: { id: true, type: true, content: true, imageUrl: true, audioUrl: true, videoUrl: true, options: true, score: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!exam) redirect(`/events/${id}`);

  const attempts = await db.examAttempt.findMany({
    where: { examId: exam.id, studentId: session.user.id },
    orderBy: { attemptNumber: "desc" },
  });
  const latestAttempt = attempts[0] ?? null;
  const completedCount = attempts.filter((a) => a.isCompleted).length;

  const data = {
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
      questionCount: exam.questions.length,
    },
    questions: exam.isRandomized ? [...exam.questions].sort(() => Math.random() - 0.5) : exam.questions,
    attempt: latestAttempt
      ? {
          isCompleted: latestAttempt.isCompleted,
          score: latestAttempt.score,
          submittedAt: latestAttempt.submittedAt?.toISOString() ?? null,
          attemptNumber: latestAttempt.attemptNumber,
        }
      : null,
    maxAttempts: exam.maxAttempts,
    completedAttempts: completedCount,
  };

  return <EventExamClient eventId={id} data={data} />;
}
