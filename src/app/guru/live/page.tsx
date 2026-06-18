import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Video } from "lucide-react";
import LiveSessionGuruClient from "@/components/live/LiveSessionGuruClient";

export const metadata = { title: "Kelas Online" };

export default async function GuruLivePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const [classes, sessions] = await Promise.all([
    db.class.findMany({
      where: { teacherId: session.user.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.liveSession.findMany({
      where: { teacherId: session.user.id },
      include: { class: { select: { id: true, name: true } } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Video className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelas Online</h1>
          <p className="text-sm text-gray-500">Jadwalkan dan kelola sesi kelas live</p>
        </div>
      </div>

      <LiveSessionGuruClient
        classes={JSON.parse(JSON.stringify(classes))}
        initialSessions={JSON.parse(JSON.stringify(sessions))}
      />
    </div>
  );
}
