import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "Jadwal Pelajaran" };

const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
const DAY_LABEL: Record<string, string> = {
  SENIN: "Senin", SELASA: "Selasa", RABU: "Rabu", KAMIS: "Kamis",
  JUMAT: "Jumat", SABTU: "Sabtu", MINGGU: "Minggu",
};
const DAY_COLOR: Record<string, string> = {
  SENIN: "bg-blue-50 border-blue-200", SELASA: "bg-purple-50 border-purple-200",
  RABU: "bg-green-50 border-green-200", KAMIS: "bg-yellow-50 border-yellow-200",
  JUMAT: "bg-orange-50 border-orange-200", SABTU: "bg-pink-50 border-pink-200",
  MINGGU: "bg-red-50 border-red-200",
};
const DAY_BADGE: Record<string, string> = {
  SENIN: "bg-blue-100 text-blue-700", SELASA: "bg-purple-100 text-purple-700",
  RABU: "bg-green-100 text-green-700", KAMIS: "bg-yellow-100 text-yellow-700",
  JUMAT: "bg-orange-100 text-orange-700", SABTU: "bg-pink-100 text-pink-700",
  MINGGU: "bg-red-100 text-red-700",
};

export default async function SiswaJadwalPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        select: {
          name: true,
          subject: { select: { name: true, color: true } },
          teacher: { select: { name: true } },
          schedules: { orderBy: { startTime: "asc" }, include: { roomRel: { select: { name: true } } } },
        },
      },
    },
  });

  type ScheduleEntry = {
    classId: string;
    className: string;
    subjectName: string;
    subjectColor: string;
    teacherName: string;
    startTime: string;
    endTime: string;
    room: string | null;
  };

  const byDay: Record<string, ScheduleEntry[]> = {};
  for (const day of DAYS) byDay[day] = [];

  for (const ec of enrolled) {
    for (const s of ec.class.schedules) {
      byDay[s.dayOfWeek]?.push({
        classId: ec.classId,
        className: ec.class.name,
        subjectName: ec.class.subject.name,
        subjectColor: ec.class.subject.color,
        teacherName: ec.class.teacher.name,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.roomRel?.name ?? null,
      });
    }
  }

  const activeDays = DAYS.filter((d) => byDay[d].length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <CalendarDays className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h1>
          <p className="text-sm text-gray-500">Jadwal mingguan kelas kamu</p>
        </div>
      </div>

      {activeDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
          <CalendarDays className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada jadwal terdaftar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDays.map((day) => (
            <div key={day} className={`rounded-xl border p-4 ${DAY_COLOR[day] ?? "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${DAY_BADGE[day] ?? "bg-gray-100 text-gray-600"}`}>
                  {DAY_LABEL[day]}
                </span>
                <span className="text-xs text-gray-400">{byDay[day].length} sesi</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-white/80 px-4 py-3 shadow-sm">
                    <div className="h-10 w-1 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: s.subjectColor }} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{s.subjectName}</p>
                      <p className="text-xs text-gray-500">{s.className}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.startTime} – {s.endTime}</p>
                      <p className="text-xs text-gray-400">{s.teacherName}</p>
                      {s.room && <p className="text-xs text-gray-400">📍 {s.room}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
