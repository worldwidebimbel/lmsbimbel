import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookMarked, Users, CalendarDays, BookOpen, ClipboardList } from "lucide-react";

export const metadata = { title: "Kelas Saya" };

const DAY_LABEL: Record<string, string> = {
  SENIN: "Sen", SELASA: "Sel", RABU: "Rab", KAMIS: "Kam",
  JUMAT: "Jum", SABTU: "Sab", MINGGU: "Min",
};

export default async function GuruKelasPage() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/guru");

  const classes = await db.class.findMany({
    where: { teacherId: session.user.id, isActive: true },
    include: {
      subject: { select: { name: true, code: true, color: true } },
      schedules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      _count: { select: { students: true, materials: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
          <BookMarked className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelas Saya</h1>
          <p className="text-sm text-gray-500">{classes.length} kelas aktif</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
          <BookMarked className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada kelas yang diampu</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((cls) => (
            <div key={cls.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: cls.subject.color + "22" }}>
                  <BookOpen className="h-5 w-5" style={{ color: cls.subject.color }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{cls.name}</h3>
                  <p className="text-xs text-gray-400">{cls.subject.name} ({cls.subject.code})</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{cls._count.students} siswa</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{cls._count.materials} materi</span>
                <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{cls._count.assignments} tugas</span>
              </div>

              {cls.schedules.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cls.schedules.map((s) => (
                    <span key={s.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      <CalendarDays className="h-3 w-3" />
                      {DAY_LABEL[s.dayOfWeek]} {s.startTime}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <Link href={`/guru/materi?classId=${cls.id}`}
                  className="flex-1 rounded-lg bg-blue-50 py-2 text-center text-xs font-medium text-blue-700 hover:bg-blue-100">
                  Materi
                </Link>
                <Link href={`/guru/tugas?classId=${cls.id}`}
                  className="flex-1 rounded-lg bg-purple-50 py-2 text-center text-xs font-medium text-purple-700 hover:bg-purple-100">
                  Tugas
                </Link>
                <Link href={`/guru/ujian?classId=${cls.id}`}
                  className="flex-1 rounded-lg bg-indigo-50 py-2 text-center text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                  Ujian
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
