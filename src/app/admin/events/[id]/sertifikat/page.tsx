import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import EventSertifikatClient from "@/components/admin/EventSertifikatClient";

export const metadata = { title: "Terbitkan Sertifikat" };

export default async function EventSertifikatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/");

  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true, type: true, status: true },
  });
  if (!event) redirect("/admin/events");

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: [{ rank: "asc" }, { score: "desc" }],
  });

  const existingCerts = await db.certificate.findMany({
    where: { eventId: id },
    select: { userId: true, code: true },
  });
  const certMap = Object.fromEntries(existingCerts.map((c) => [c.userId, c.code]));

  return (
    <EventSertifikatClient
      event={JSON.parse(JSON.stringify(event))}
      registrations={JSON.parse(JSON.stringify(registrations))}
      certMap={certMap}
    />
  );
}
