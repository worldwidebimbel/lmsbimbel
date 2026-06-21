import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import EventRegistrationsClient from "@/components/admin/EventRegistrationsClient";

export const metadata = { title: "Peserta Event" };

export default async function AdminEventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true, branchId: true },
  });
  if (!event) redirect("/admin/events");
  if (!isSuperAdmin && branchId && event.branchId !== branchId) redirect("/admin/events");

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: { select: { name: true, price: true } },
    },
    orderBy: [{ rank: "asc" }, { registeredAt: "asc" }],
  });

  const serialized = registrations.map((r) => ({
    ...r,
    registeredAt: r.registeredAt.toISOString(),
    attendedAt: r.attendedAt?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <EventRegistrationsClient
      eventId={id}
      eventTitle={event.title}
      initialRegistrations={serialized}
    />
  );
}
