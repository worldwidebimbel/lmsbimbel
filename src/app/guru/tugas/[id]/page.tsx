import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import SubmissionList from "@/components/tugas/SubmissionList";
import { ClipboardList, ArrowLeft, Clock, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const metadata = { title: "Detail Tugas" };

export default async function GuruTugasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      submissions: {
        include: { student: { select: { id: true, name: true, avatar: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!assignment || assignment.teacherId !== session.user.id) notFound();

  const graded = assignment.submissions.filter((s) => s.score !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/guru/tugas"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-sm text-gray-500">{assignment.class.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Submission</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{assignment.submissions.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sudah Dinilai</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{graded}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Belum Dinilai</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{assignment.submissions.length - graded}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Nilai Maks</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{assignment.maxScore}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            Deadline: {format(new Date(assignment.dueDate), "d MMMM yyyy, HH:mm", { locale: localeId })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" />
            {assignment.class.name}
          </span>
          {assignment.fileUrl && (
            <a
              href={assignment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📎 Buka File Soal
            </a>
          )}
        </div>
        {assignment.description && (
          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
        )}
      </div>

      <SubmissionList
        assignmentId={assignment.id}
        maxScore={assignment.maxScore}
        initialSubmissions={JSON.parse(JSON.stringify(assignment.submissions))}
      />
    </div>
  );
}
