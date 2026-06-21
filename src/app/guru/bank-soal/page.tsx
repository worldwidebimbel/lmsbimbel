import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import BankSoalClient from "@/components/guru/BankSoalClient";

export const metadata = { title: "Bank Soal" };

export default async function BankSoalPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const { branchId } = await getBranchScope();
  const classWhere = branchId
    ? { teacherId: session.user.id, branchId }
    : { teacherId: session.user.id };

  const teacherClasses = await db.class.findMany({
    where: classWhere,
    select: { id: true, subjectId: true },
  });

  const subjectIds = [...new Set(teacherClasses.map((c) => c.subjectId).filter(Boolean))] as string[];

  const [subjects, bankQuestions, myExams] = await Promise.all([
    db.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, color: true },
    }),
    db.question.findMany({
      where: { examId: null },
      include: { subject: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.exam.findMany({
      where: { classId: { in: teacherClasses.map((c) => c.id) } },
      select: { id: true, title: true, class: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <BookMarked className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Soal</h1>
          <p className="text-sm text-gray-500">Kelola soal reusable — import ke ujian manapun</p>
        </div>
      </div>

      <BankSoalClient
        initialQuestions={JSON.parse(JSON.stringify(bankQuestions))}
        subjects={JSON.parse(JSON.stringify(subjects))}
        exams={JSON.parse(JSON.stringify(myExams))}
      />
    </div>
  );
}
