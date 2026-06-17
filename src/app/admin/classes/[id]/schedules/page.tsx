import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import ScheduleManagerClient from "@/components/admin/ScheduleManagerClient";

export const metadata = { title: "Kelola Jadwal" };

export default async function SchedulesPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { id } = await params;
  const cls = await db.class.findUnique({
    where: { id },
    select: {
      id: true, name: true,
      subject: { select: { name: true, color: true } },
      teacher: { select: { name: true } },
      schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!cls) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/classes/${id}`} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: cls.subject.color + "22" }}>
          <CalendarDays className="h-5 w-5" style={{ color: cls.subject.color }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jadwal — {cls.name}</h1>
          <p className="text-sm text-gray-500">{cls.subject.name} · {cls.teacher.name}</p>
        </div>
      </div>

      <ScheduleManagerClient
        classId={id}
        initialSchedules={JSON.parse(JSON.stringify(cls.schedules))}
      />
    </div>
  );
}
