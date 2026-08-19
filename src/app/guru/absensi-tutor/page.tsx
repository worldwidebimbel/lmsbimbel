import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Clock, QrCode, LogIn, LogOut, Calendar } from "lucide-react";
import GuruAbsensiTutorClient from "@/components/guru/GuruAbsensiTutorClient";

export const metadata = { title: "Absensi Tutor" };

export default async function GuruAbsensiTutorPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayRecord, classes, recentRecords] = await Promise.all([
    db.teacherAttendance.findUnique({
      where: { teacherId_date: { teacherId: session.user.id, date: today } },
    }),
    db.class.findMany({
      where: { teacherId: session.user.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.teacherAttendance.findMany({
      where: { teacherId: session.user.id },
      include: { class: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absensi Tutor</h1>
          <p className="text-sm text-gray-500">Catat kehadiran Anda hari ini</p>
        </div>
      </div>

      <GuruAbsensiTutorClient
        todayRecord={todayRecord ? JSON.parse(JSON.stringify(todayRecord)) : null}
        classes={JSON.parse(JSON.stringify(classes))}
        recentRecords={JSON.parse(JSON.stringify(recentRecords))}
      />
    </div>
  );
}
