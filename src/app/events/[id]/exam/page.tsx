import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EventExamClient from "@/components/event/EventExamClient";

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
        select: { id: true, type: true, content: true, options: true, score: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!exam) redirect(`/events/${id}`);

  const attempt = await db.examAttempt.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: session.user.id } },
  });

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
    attempt: attempt
      ? {
          isCompleted: attempt.isCompleted,
          score: attempt.score,
          submittedAt: attempt.submittedAt?.toISOString() ?? null,
        }
      : null,
  };

  return <EventExamClient eventId={id} data={data} />;
}
