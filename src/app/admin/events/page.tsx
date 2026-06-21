import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import EventsClient from "@/components/admin/EventsClient";

export const metadata = { title: "Event Berbayar" };

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { branchId, isSuperAdmin } = await getBranchScope();

  return <EventsClient isSuperAdmin={isSuperAdmin} userBranchId={branchId} />;
}
