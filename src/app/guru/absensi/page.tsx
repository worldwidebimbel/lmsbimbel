import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AbsensiGuruClient from "@/components/absensi/AbsensiGuruClient";
import { CheckSquare } from "lucide-react";

export const metadata = { title: "Absensi" };

export default async function GuruAbsensiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const [classes, attendances] = await Promise.all([
    db.class.findMany({
      where: { teacherId: session.user.id, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.attendance.findMany({
      where: {
        class: { teacherId: session.user.id },
      },
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { records: true } },
      },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <CheckSquare className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Absensi</h1>
          <p className="text-sm text-gray-500">Catat kehadiran siswa per sesi</p>
        </div>
      </div>

      <AbsensiGuruClient
        classes={classes}
        initialAttendances={JSON.parse(JSON.stringify(attendances))}
      />
    </div>
  );
}
