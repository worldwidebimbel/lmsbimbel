import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileCheck, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Ujian" };

export default async function SiswaUjianPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    select: { classId: true },
  });
  const classIds = enrolled.map((e) => e.classId);

  const exams = await db.exam.findMany({
    where: { classId: { in: classIds }, isPublished: true },
    include: {
      class: { select: { name: true, subject: { select: { name: true, color: true } } } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <FileCheck className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ujian</h1>
          <p className="text-sm text-gray-500">Daftar ujian yang tersedia</p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
          <FileCheck className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada ujian aktif</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const attempt = exam.attempts[0];
            const isCompleted = attempt?.isCompleted;
            const isPassed = isCompleted && (attempt?.score ?? 0) >= exam.passingScore;
            const isAvailable = !exam.startTime || new Date(exam.startTime) <= now;
            const isExpired = exam.endTime && new Date(exam.endTime) < now;

            return (
              <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: exam.class.subject.color }} />
                      <span className="text-xs text-gray-400">{exam.class.subject.name} · {exam.class.name}</span>
                      {isCompleted && (
                        isPassed
                          ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Lulus</span>
                          : <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" />Tidak Lulus</span>
                      )}
                      {isExpired && !isCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"><AlertCircle className="h-3 w-3" />Kadaluarsa</span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{exam.title}</h3>
                    {exam.description && <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{exam.description}</p>}

                    <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration} menit</span>
                      <span className="flex items-center gap-1"><FileCheck className="h-3.5 w-3.5" />{exam._count.questions} soal</span>
                      <span>Lulus min. {exam.passingScore}%</span>
                      {exam.startTime && !isAvailable && (
                        <span>Mulai: {format(new Date(exam.startTime), "d MMM HH:mm", { locale: localeId })}</span>
                      )}
                      {exam.endTime && (
                        <span>Berakhir: {format(new Date(exam.endTime), "d MMM HH:mm", { locale: localeId })}</span>
                      )}
                    </div>

                    {isCompleted && (
                      <p className="mt-2 text-sm font-semibold">
                        Nilai: <span className={isPassed ? "text-green-600" : "text-red-600"}>{attempt?.score ?? 0}%</span>
                      </p>
                    )}
                  </div>

                  {!isCompleted && !isExpired && isAvailable && (
                    <Link href={`/siswa/ujian/${exam.id}`}
                      className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                      Kerjakan
                    </Link>
                  )}
                  {isCompleted && (
                    <Link href={`/siswa/ujian/${exam.id}`}
                      className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                      Lihat Hasil
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
