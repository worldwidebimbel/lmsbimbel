import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import JurnalMengajarClient from "@/components/guru/JurnalMengajarClient";

export const metadata = { title: "Jurnal Mengajar" };

export default async function JurnalMengajarPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const { branchId } = await getBranchScope();

  const classWhere = branchId
    ? { teacherId: session.user.id, branchId, isActive: true }
    : { teacherId: session.user.id, isActive: true };

  const [teacherClasses, journals] = await Promise.all([
    db.class.findMany({
      where: classWhere,
      select: {
        id: true, name: true,
        subject: { select: { name: true } },
        schedules: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.teachingJournal.findMany({
      where: { teacherId: session.user.id },
      include: {
        class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      },
      orderBy: { sessionDate: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <NotebookPen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Mengajar</h1>
          <p className="text-sm text-gray-500">Catat kegiatan mengajar per sesi</p>
        </div>
      </div>

      <JurnalMengajarClient
        classes={JSON.parse(JSON.stringify(teacherClasses))}
        initialJournals={JSON.parse(JSON.stringify(journals))}
      />
    </div>
  );
}
