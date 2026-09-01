import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import EventExamListClient from "@/components/admin/EventExamListClient";

export const metadata = { title: "Ujian Event" };

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

  const exams = await db.exam.findMany({
    where: { eventId: id },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = exams.map((e) => ({
    ...e,
    startTime: e.startTime?.toISOString() ?? null,
    endTime: e.endTime?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <EventExamListClient
      eventId={id}
      eventTitle={event.title}
      exams={serialized}
      backHref="/admin/events"
    />
  );
}
