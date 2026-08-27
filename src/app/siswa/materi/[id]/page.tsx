import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import MaterialLearnClient from "@/components/materi/MaterialLearnClient";
import { ActivitySequence, type ActivityStep } from "@/components/materi/ActivitySequence";
import { MaterialBabList, MaterialHelpBox } from "@/components/materi/MaterialSidebarExtras";

export const dynamic = "force-dynamic";
export const metadata = { title: "Detail Materi" };

function stepLabel(type: string): string {
  switch (type) {
    case "VIDEO": case "YOUTUBE": return "Video Materi";
    case "TEXT": return "Artikel Materi";
    case "PRESENTATION": return "Artikel Materi (PPT)";
    case "DOCUMENT": return "Dokumen Materi";
    case "LINK": return "Link Materi";
    default: return "Materi";
  }
}

function stepKind(type: string): ActivityStep["kind"] {
  if (type === "VIDEO" || type === "YOUTUBE") return "VIDEO";
  return "ARTICLE";
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const { id } = await params;
  const material = await db.material.findUnique({
    where: { id, isPublished: true },
    include: {
      subject: { select: { id: true, name: true, color: true, code: true } },
      class: { select: { id: true, name: true, teacherId: true, teacher: { select: { id: true, name: true } } } },
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

  // Sibling materials within the same "Bab" (chapter) — sequence for Rangkaian Aktivitas + prev/next nav.
  const chapterSiblings = material.chapterTitle
    ? await db.material.findMany({
        where: { chapterTitle: material.chapterTitle, classId: material.classId, isPublished: true },
        orderBy: { order: "asc" },
        include: {
          progress: { where: { studentId: session.user.id }, select: { isCompleted: true } },
          exams: { where: { isPublished: true }, select: { id: true, title: true } },
        },
      })
    : [material];

  const currentIndex = chapterSiblings.findIndex((m) => m.id === material.id);

  const activitySteps: ActivityStep[] = [];
  for (const sib of chapterSiblings) {
    const isCurrent = sib.id === material.id;
    const isDone = sib.progress[0]?.isCompleted ?? false;
    activitySteps.push({
      id: sib.id,
      href: `/siswa/materi/${sib.id}`,
      label: stepLabel(sib.type),
      kind: stepKind(sib.type),
      status: isDone ? "DONE" : isCurrent ? "CURRENT" : "TODO",
      isCurrent,
    });
    for (const ex of sib.exams) {
      activitySteps.push({
        id: ex.id,
        href: `/siswa/ujian/${ex.id}`,
        label: ex.title,
        kind: "EVALUATION",
        status: "TODO",
        isCurrent: false,
      });
    }
  }

  const prevSibling = currentIndex > 0 ? chapterSiblings[currentIndex - 1] : null;
  const nextSibling = currentIndex >= 0 && currentIndex < chapterSiblings.length - 1 ? chapterSiblings[currentIndex + 1] : null;
  const firstExam = material.exams[0] ?? null;

  let nextHref: string | null = null;
  let nextLabel: string | null = null;
  if (nextSibling) {
    nextHref = `/siswa/materi/${nextSibling.id}`;
    nextLabel = `Lanjut ke ${stepLabel(nextSibling.type)}`;
  } else if (firstExam) {
    nextHref = `/siswa/ujian/${firstExam.id}`;
    nextLabel = "Lanjut ke Latihan";
  }

  // "Materi Bab" sidebar list — use key points from the chapter's article-type material (if any).
  const articleSibling = chapterSiblings.find((m) => m.type === "TEXT" && (m.keyPoints as string[] | null)?.length);
  const babPoints = (articleSibling?.keyPoints as string[] | null) ?? [];

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

  const isCompleted = material.progress[0]?.isCompleted ?? false;
  const positionInChapter = currentIndex >= 0 ? currentIndex + 1 : 1;
  const pageTitle = material.chapterTitle ?? material.title;
  const pageSubtitle = `${positionInChapter}. ${stepLabel(material.type)}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link href="/siswa/materi" className="hover:text-blue-600">Program Saya</Link>
          <ChevronRight className="h-3 w-3" />
          {material.class && (
            <>
              <Link href="/siswa/materi" className="hover:text-blue-600">{material.class.name}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          {material.chapterTitle && (
            <>
              <span className="text-gray-600">{material.chapterTitle}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="font-medium text-gray-700">{stepLabel(material.type)}</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 text-sm font-semibold text-gray-700">{pageSubtitle}</p>
          {material.description && (
            <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{material.description}</p>
          )}
        </div>

        <MaterialLearnClient
          materialId={material.id}
          studentId={session.user.id}
          type={material.type}
          fileUrl={material.fileUrl}
          content={material.content}
          keyPoints={(material.keyPoints as string[] | null) ?? []}
          tips={material.tips}
          slideCount={material.slideCount}
          fileName={material.title}
          isCompleted={isCompleted}
          prevHref={prevSibling ? `/siswa/materi/${prevSibling.id}` : null}
          nextHref={nextHref}
          nextLabel={nextLabel}
        />

        {examWithAttempts.length > 0 && (
          <div className="space-y-3 pt-2">
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

      {/* Right sidebar */}
      <div className="space-y-4">
        <ActivitySequence steps={activitySteps} />
        <MaterialBabList
          title="Materi Bab"
          items={babPoints}
          detailHref={articleSibling ? `/siswa/materi/${articleSibling.id}` : undefined}
        />
        <MaterialHelpBox teacherId={material.class?.teacher?.id} teacherName={material.class?.teacher?.name} />
      </div>
    </div>
  );
}
