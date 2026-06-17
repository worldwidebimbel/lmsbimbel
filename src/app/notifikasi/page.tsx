import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import NotifikasiClient from "@/components/NotifikasiClient";

export const metadata = { title: "Notifikasi" };

export default async function NotifikasiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {notifications.filter((n) => !n.isRead).length} belum dibaca
        </p>
      </div>
      <NotifikasiClient initialNotifications={JSON.parse(JSON.stringify(notifications))} />
    </div>
  );
}
