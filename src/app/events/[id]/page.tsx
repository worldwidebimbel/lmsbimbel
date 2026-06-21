import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventDetailClient from "@/components/event/EventDetailClient";

export const metadata = { title: "Detail Event" };

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id, status: { in: ["PUBLISHED", "ONGOING"] } },
    include: {
      branch: { select: { name: true, code: true } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) {
    redirect("/events");
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;

  const [exam, registration] = await Promise.all([
    db.exam.findFirst({ where: { eventId: id, isPublished: true }, select: { id: true } }),
    session?.user
      ? db.eventRegistration.findUnique({
          where: { eventId_userId: { eventId: id, userId: session.user.id } },
          select: { id: true },
        })
      : null,
  ]);

  const serializedEvent = {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };

  return (
    <EventDetailClient
      event={serializedEvent}
      isAuthenticated={isAuthenticated}
      hasExam={!!exam}
      isRegistered={!!registration}
    />
  );
}
