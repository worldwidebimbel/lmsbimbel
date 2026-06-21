import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileCheck, Plus, Clock, Users, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Ujian" };

export default async function GuruUjianPage() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/guru");

  const { branchId } = await getBranchScope();
  const classWhere = branchId
    ? { teacherId: session.user.id, branchId }
    : { teacherId: session.user.id };

  const exams = await db.exam.findMany({
    where: { class: classWhere },
    include: {
      class: { select: { name: true, subject: { select: { name: true, color: true } } } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <FileCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ujian</h1>
            <p className="text-sm text-gray-500">{exams.length} ujian dibuat</p>
          </div>
        </div>
        <Link href="/guru/ujian/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Buat Ujian
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
          <FileCheck className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Belum ada ujian. Mulai buat ujian pertama.</p>
          <Link href="/guru/ujian/new" className="mt-3 text-sm text-indigo-600 hover:underline">Buat Ujian →</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Link key={exam.id} href={`/guru/ujian/${exam.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: exam.class?.subject.color }} />
                    <span className="text-xs text-gray-400">{exam.class?.subject.name} · {exam.class?.name}</span>
                    {exam.isPublished
                      ? <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Dipublikasikan</span>
                      : <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"><AlertCircle className="h-3 w-3" />Draft</span>
                    }
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-gray-900 group-hover:text-indigo-700">{exam.title}</h3>
                  {exam.description && <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{exam.description}</p>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration} menit</span>
                <span className="flex items-center gap-1"><FileCheck className="h-3.5 w-3.5" />{exam._count.questions} soal</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{exam._count.attempts} pengerjaan</span>
                {exam.startTime && (
                  <span className="flex items-center gap-1">
                    🗓 {format(new Date(exam.startTime), "d MMM yyyy, HH:mm", { locale: localeId })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
