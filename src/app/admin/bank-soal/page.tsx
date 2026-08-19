import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import BankSoalAdminClient from "@/components/admin/BankSoalAdminClient";

export const metadata = { title: "Bank Soal - Admin" };

export default async function AdminBankSoalPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [subjects, bankQuestions, allExams, stats] = await Promise.all([
    db.subject.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    db.question.findMany({
      where: { examId: null },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        examQuestions: {
          select: {
            examId: true,
            exam: { select: { title: true, class: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.exam.findMany({
      select: { id: true, title: true, class: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    (async () => {
      const [total, byType, byDifficulty, bySubject, usedInExams] = await Promise.all([
        db.question.count({ where: { examId: null } }),
        db.question.groupBy({ by: ["type"], where: { examId: null }, _count: true }),
        db.question.groupBy({ by: ["difficulty"], where: { examId: null }, _count: true }),
        db.question.groupBy({ by: ["subjectId"], where: { examId: null }, _count: true }),
        db.examQuestion.count(),
      ]);
      return { total, byType, byDifficulty, bySubject, usedInExams };
    })(),
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const statsFormatted = {
    total: stats.total,
    usedInExams: stats.usedInExams,
    byType: stats.byType.map((t) => ({ type: t.type, count: t._count })),
    byDifficulty: stats.byDifficulty.map((d) => ({ difficulty: d.difficulty, count: d._count })),
    bySubject: stats.bySubject.map((s) => ({
      subjectId: s.subjectId,
      subject: s.subjectId ? subjectMap.get(s.subjectId) : null,
      count: s._count,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <BookMarked className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
          <p className="text-sm text-gray-500">Kelola bank soal terpusat — reusable ke ujian manapun (M:N)</p>
        </div>
      </div>

      <BankSoalAdminClient
        initialQuestions={JSON.parse(JSON.stringify(bankQuestions))}
        subjects={JSON.parse(JSON.stringify(subjects))}
        exams={JSON.parse(JSON.stringify(allExams))}
        stats={JSON.parse(JSON.stringify(statsFormatted))}
      />
    </div>
  );
}
