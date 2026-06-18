import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Video, Calendar, Clock, ExternalLink, Link2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Kelas Online" };

export default async function SiswaLivePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    select: { classId: true },
  });
  const classIds = enrolled.map((e) => e.classId);

  const sessions = await db.liveSession.findMany({
    where: { classId: { in: classIds }, isActive: true },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const now = new Date();
  const upcoming = sessions.filter((s) => !s.endTime || !isPast(new Date(s.endTime)));
  const past = sessions.filter((s) => s.endTime && isPast(new Date(s.endTime)));

  function statusOf(s: typeof sessions[0]) {
    const start = new Date(s.startTime);
    const end = s.endTime ? new Date(s.endTime) : null;
    if (end && isPast(end)) return { label: "Selesai", cls: "bg-gray-100 text-gray-500" };
    if (isPast(start) && (!end || !isPast(end))) return { label: "Sedang Live 🔴", cls: "bg-red-100 text-red-700" };
    if (isToday(start)) return { label: "Hari Ini", cls: "bg-amber-100 text-amber-700" };
    return { label: "Mendatang", cls: "bg-blue-100 text-blue-700" };
  }

  const SessionCard = ({ s, showRec }: { s: typeof sessions[0]; showRec?: boolean }) => {
    const status = statusOf(s);
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s.class.name}</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{s.title}</h3>
          {s.description && <p className="mt-1 text-sm text-gray-500">{s.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
            {format(new Date(s.startTime), "EEEE, d MMM yyyy", { locale: localeId })}
          </span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
            {format(new Date(s.startTime), "HH:mm")}
            {s.endTime && ` – ${format(new Date(s.endTime), "HH:mm")}`}
          </span>
          <span>Platform: <strong>{s.platform}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          {s.meetingUrl && (
            <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              <Video className="h-4 w-4" /> Masuk ke Kelas
            </a>
          )}
          {showRec && s.recordingUrl && (
            <a href={s.recordingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              <Link2 className="h-4 w-4" /> Tonton Rekaman
            </a>
          )}
          {!s.meetingUrl && (
            <span className="text-sm text-gray-400 italic">Link meeting belum tersedia</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <Video className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelas Online</h1>
          <p className="text-sm text-gray-500">Jadwal sesi live dan rekaman kelas</p>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
          <Video className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">Belum ada sesi kelas online yang dijadwalkan</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800">Sesi Mendatang & Live</h2>
          {upcoming.map((s) => <SessionCard key={s.id} s={s} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-500">Riwayat Kelas</h2>
          {past.map((s) => <SessionCard key={s.id} s={s} showRec />)}
        </div>
      )}
    </div>
  );
}
