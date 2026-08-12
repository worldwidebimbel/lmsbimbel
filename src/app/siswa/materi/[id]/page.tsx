import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Video, Link2, Youtube, BookOpen, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import MaterialDetailClient from "@/components/materi/MaterialDetailClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Detail Materi" };

const TYPE_ICON: Record<string, React.ElementType> = {
  PDF: FileText, VIDEO: Video, YOUTUBE: Youtube,
  PRESENTATION: FileText, DOCUMENT: FileText, LINK: Link2, TEXT: BookOpen,
};

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const { id } = await params;
  const material = await db.material.findUnique({
    where: { id, isPublished: true },
    include: {
      subject: { select: { id: true, name: true, color: true, code: true } },
      class: { select: { id: true, name: true } },
      uploader: { select: { name: true } },
      progress: { where: { studentId: session.user.id }, select: { isCompleted: true, lastViewedAt: true } },
      exams: {
        where: { isPublished: true },
        select: {
          id: true, title: true, duration: true, passingScore: true,
          maxAttempts: true, startTime: true, endTime: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!material) notFound();

  // Get attempt info for each exam
  const examWithAttempts = await Promise.all(
    material.exams.map(async (exam) => {
      const attempts = await db.examAttempt.findMany({
        where: { examId: exam.id, studentId: session.user.id, isCompleted: true },
        select: { id: true, score: true, attemptNumber: true },
        orderBy: { attemptNumber: "desc" },
      });
      return {
        ...exam,
        completedAttempts: attempts.length,
        bestScore: attempts.length > 0 ? Math.max(...attempts.map((a) => a.score ?? 0)) : null,
        latestScore: attempts[0]?.score ?? null,
      };
    })
  );

  const Icon = TYPE_ICON[material.type] ?? FileText;
  const isCompleted = material.progress[0]?.isCompleted ?? false;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/siswa/materi" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Materi
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{material.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {material.subject && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: material.subject.color }} />
                  {material.subject.name}
                </span>
              )}
              {material.class && <span>· {material.class.name}</span>}
              <span>· {material.uploader.name}</span>
            </div>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="h-3.5 w-3.5" /> Selesai
            </span>
          )}
        </div>

        {material.description && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{material.description}</p>
        )}

        <MaterialDetailClient
          materialId={material.id}
          fileUrl={material.fileUrl}
          type={material.type}
          studentId={session.user.id}
          isCompleted={isCompleted}
        />
      </div>

      {examWithAttempts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            Quiz & Ujian
          </h2>
          {examWithAttempts.map((exam) => {
            const canAttempt = exam.completedAttempts < exam.maxAttempts;
            const now = new Date();
            const notStarted = exam.startTime ? now < exam.startTime : false;
            const ended = exam.endTime ? now > exam.endTime : false;

            return (
              <div key={exam.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{exam._count.questions} soal</span>
                      <span>{exam.duration} menit</span>
                      <span>KKM {exam.passingScore}%</span>
                      {exam.maxAttempts > 1 && (
                        <span>{exam.completedAttempts}/{exam.maxAttempts} percobaan</span>
                      )}
                    </div>
                    {exam.bestScore !== null && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className={`font-medium ${exam.bestScore >= exam.passingScore ? "text-green-600" : "text-red-500"}`}>
                          Skor terbaik: {exam.bestScore}%
                        </span>
                        {exam.bestScore >= exam.passingScore ? (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Lulus</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> Belum lulus</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {notStarted ? (
                      <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">
                        Mulai {exam.startTime ? new Date(exam.startTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    ) : ended ? (
                      <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">Waktu habis</span>
                    ) : canAttempt ? (
                      <Link
                        href={`/siswa/ujian/${exam.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                      >
                        {exam.completedAttempts > 0 ? "Coba Lagi" : "Kerjakan"}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400 px-3 py-2 rounded-lg bg-gray-50">
                        Maks. percobaan tercapai
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
