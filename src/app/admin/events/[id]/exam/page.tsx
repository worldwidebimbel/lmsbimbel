import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import EventExamAdminClient from "@/components/admin/EventExamAdminClient";

export const metadata = { title: "Kelola Ujian Event" };

export default async function AdminEventExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true, branchId: true },
  });
  if (!event) redirect("/admin/events");
  if (!isSuperAdmin && branchId && event.branchId !== branchId) redirect("/admin/events");

  const exam = await db.exam.findFirst({
    where: { eventId: id },
    include: { questions: { orderBy: { createdAt: "asc" } } },
  });

  const serialized = exam
    ? {
        ...exam,
        startTime: exam.startTime?.toISOString() ?? null,
        endTime: exam.endTime?.toISOString() ?? null,
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
        questions: exam.questions.map((q) => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
        })),
      }
    : null;

  return (
    <EventExamAdminClient
      eventId={id}
      eventTitle={event.title}
      initialExam={serialized}
    />
  );
}
