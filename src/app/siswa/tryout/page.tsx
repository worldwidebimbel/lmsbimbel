import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Clock, CheckCircle, XCircle, Calendar, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Tryout" };

export default async function SiswaTryoutPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const now = new Date();

  // Get tryout events (published) + exams linked to them
  const events = await db.event.findMany({
    where: {
      type: "TRYOUT",
      status: { in: ["PUBLISHED", "ONGOING"] },
    },
    include: {
      exams: {
        where: { isPublished: true },
        include: {
          _count: { select: { questions: true } },
          attempts: {
            where: { studentId: session.user.id, isCompleted: true },
            select: { id: true, score: true, attemptNumber: true },
            orderBy: { attemptNumber: "desc" },
          },
        },
      },
      registrations: {
        where: { userId: session.user.id },
        select: { id: true, status: true, paymentStatus: true },
      },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Also get standalone tryout exams (eventId set but no event, or exams with "tryout" in title)
  const standaloneTryoutExams = await db.exam.findMany({
    where: {
      isPublished: true,
      eventId: null,
      classId: null,
      OR: [
        { title: { contains: "tryout", mode: "insensitive" } },
        { title: { contains: "TRYOUT", mode: "insensitive" } },
      ],
    },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId: session.user.id, isCompleted: true },
        select: { id: true, score: true, attemptNumber: true },
        orderBy: { attemptNumber: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const hasEvents = events.length > 0;
  const hasStandalone = standaloneTryoutExams.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tryout</h1>
          <p className="text-sm text-gray-500">Simulasi ujian & tryout online</p>
        </div>
      </div>

      {!hasEvents && !hasStandalone ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
          <Trophy className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada tryout tersedia</p>
          <p className="text-xs text-gray-400 mt-1">Tryout akan muncul di sini saat admin mempublikasikannya.</p>
        </div>
      ) : (
        <>
          {/* Tryout Events */}
          {hasEvents && (
            <div className="space-y-4">
              {events.map((event) => {
                const isRegistered = event.registrations.length > 0;
                const reg = event.registrations[0];
                const isPaid = reg?.paymentStatus === "PAID" || reg?.paymentStatus === "FREE";
                const canAccess = isRegistered && isPaid;
                const isOngoing = event.status === "ONGOING" || (event.startDate <= now && (!event.endDate || event.endDate >= now));
                const isUpcoming = event.startDate > now;
                const isEnded = event.endDate && event.endDate < now;

                return (
                  <div key={event.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {/* Event header */}
                    <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Tryout</span>
                            {isOngoing && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Berlangsung</span>}
                            {isUpcoming && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Akan Datang</span>}
                            {isEnded && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Selesai</span>}
                          </div>
                          <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                          {event.description && <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{event.description}</p>}
                        </div>
                        {event.image && (
                          <img src={event.image} alt={event.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(event.startDate), "d MMM yyyy", { locale: localeId })}
                          {event.endDate && ` - ${format(new Date(event.endDate), "d MMM yyyy", { locale: localeId })}`}
                        </span>
                        {event.maxParticipants && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {event._count.registrations}/{event.maxParticipants} peserta
                          </span>
                        )}
                        {event.isPaid && <span className="text-orange-600 font-medium">Berbayar</span>}
                        {!event.isPaid && <span className="text-green-600 font-medium">Gratis</span>}
                      </div>
                    </div>

                    {/* Exams within event */}
                    {event.exams.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {event.exams.map((exam) => {
                          const bestAttempt = exam.attempts.length > 0
                            ? exam.attempts.reduce((best, a) => (a.score ?? 0) > (best.score ?? 0) ? a : best)
                            : null;
                          const isCompleted = !!bestAttempt;
                          const isPassed = isCompleted && (bestAttempt?.score ?? 0) >= exam.passingScore;
                          const examAvailable = !exam.startTime || new Date(exam.startTime) <= now;
                          const examExpired = exam.endTime && new Date(exam.endTime) < now;

                          return (
                            <div key={exam.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-gray-900 truncate">{exam.title}</p>
                                  {isCompleted && (
                                    isPassed
                                      ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Lulus</span>
                                      : <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" />Tidak Lulus</span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration} menit</span>
                                  <span>{exam._count.questions} soal</span>
                                  <span>KKM {exam.passingScore}%</span>
                                  {isCompleted && (
                                    <span className="font-medium">Skor: {bestAttempt?.score ?? 0}%</span>
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0">
                                {!canAccess && !isRegistered ? (
                                  <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">
                                    Daftar dulu
                                  </span>
                                ) : !canAccess && isRegistered && !isPaid ? (
                                  <span className="text-xs text-orange-500 px-3 py-2 rounded-lg bg-orange-50">
                                    Menunggu pembayaran
                                  </span>
                                ) : isCompleted ? (
                                  <Link href={`/siswa/ujian/${exam.id}`}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
                                    Lihat Hasil
                                  </Link>
                                ) : examExpired ? (
                                  <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">Waktu habis</span>
                                ) : !examAvailable ? (
                                  <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">
                                    Mulai {exam.startTime ? format(new Date(exam.startTime), "d MMM HH:mm", { locale: localeId }) : ""}
                                  </span>
                                ) : (
                                  <Link href={`/siswa/ujian/${exam.id}`}
                                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                                    Mulai <ArrowRight className="h-3.5 w-3.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-gray-400">Belum ada sesi ujian dalam tryout ini.</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Standalone Tryout Exams */}
          {hasStandalone && (
            <div className="space-y-4">
              {hasEvents && (
                <h2 className="font-semibold text-gray-800 text-sm">Tryout Lainnya</h2>
              )}
              {standaloneTryoutExams.map((exam) => {
                const bestAttempt = exam.attempts.length > 0
                  ? exam.attempts.reduce((best, a) => (a.score ?? 0) > (best.score ?? 0) ? a : best)
                  : null;
                const isCompleted = !!bestAttempt;
                const isPassed = isCompleted && (bestAttempt?.score ?? 0) >= exam.passingScore;
                const examAvailable = !exam.startTime || new Date(exam.startTime) <= now;
                const examExpired = exam.endTime && new Date(exam.endTime) < now;

                return (
                  <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Tryout</span>
                          {isCompleted && (
                            isPassed
                              ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Lulus</span>
                              : <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" />Tidak Lulus</span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">{exam.title}</h3>
                        {exam.description && <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{exam.description}</p>}
                        <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration} menit</span>
                          <span>{exam._count.questions} soal</span>
                          <span>KKM {exam.passingScore}%</span>
                          {isCompleted && <span className="font-medium">Skor: {bestAttempt?.score ?? 0}%</span>}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCompleted ? (
                          <Link href={`/siswa/ujian/${exam.id}`}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            Lihat Hasil
                          </Link>
                        ) : examExpired ? (
                          <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">Waktu habis</span>
                        ) : !examAvailable ? (
                          <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">
                            Mulai {exam.startTime ? format(new Date(exam.startTime), "d MMM HH:mm", { locale: localeId }) : ""}
                          </span>
                        ) : (
                          <Link href={`/siswa/ujian/${exam.id}`}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                            Mulai <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
