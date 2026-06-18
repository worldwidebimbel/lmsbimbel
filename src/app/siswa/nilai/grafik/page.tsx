import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NilaiProgressClient from "@/components/siswa/NilaiProgressClient";

export const metadata = { title: "Grafik Perkembangan Nilai" };

export default async function NilaiGrafikPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const grades = await db.grade.findMany({
    where: { studentId: session.user.id },
    include: {
      component: {
        include: { class: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } } },
      },
    },
    orderBy: { component: { order: "asc" } },
  });

  const examAttempts = await db.examAttempt.findMany({
    where: { studentId: session.user.id, isCompleted: true },
    include: { exam: { include: { class: { select: { id: true, name: true } } } } },
    orderBy: { submittedAt: "asc" },
  });

  const submissions = await db.submission.findMany({
    where: { studentId: session.user.id, score: { not: null } },
    include: { assignment: { include: { class: { select: { id: true, name: true } } } } },
    orderBy: { submittedAt: "asc" },
  });

  const byClass: Record<string, {
    className: string;
    subjectName: string;
    subjectColor: string;
    components: { name: string; score: number; period: string | null; order: number }[];
  }> = {};

  for (const g of grades) {
    const { classId } = g.component;
    if (!byClass[classId]) {
      byClass[classId] = {
        className: g.component.class.name,
        subjectName: g.component.class.subject.name,
        subjectColor: g.component.class.subject.color,
        components: [],
      };
    }
    byClass[classId].components.push({
      name: g.component.name,
      score: g.score,
      period: g.component.period,
      order: g.component.order,
    });
  }

  const examByClass: Record<string, { className: string; scores: { label: string; score: number; date: string }[] }> = {};
  for (const a of examAttempts) {
    const cid = a.exam.classId;
    if (!examByClass[cid]) examByClass[cid] = { className: a.exam.class.name, scores: [] };
    if (a.score !== null) {
      examByClass[cid].scores.push({
        label: a.exam.title,
        score: a.score,
        date: a.submittedAt?.toISOString() ?? "",
      });
    }
  }

  const taskByClass: Record<string, { className: string; scores: { label: string; score: number; date: string }[] }> = {};
  for (const s of submissions) {
    const cid = s.assignment.classId;
    if (!taskByClass[cid]) taskByClass[cid] = { className: s.assignment.class.name, scores: [] };
    if (s.score !== null) {
      taskByClass[cid].scores.push({
        label: s.assignment.title,
        score: s.score,
        date: s.submittedAt?.toISOString() ?? "",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/siswa/nilai" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grafik Perkembangan Nilai</h1>
          <p className="text-sm text-gray-500">Visualisasi nilai komponen, ujian, dan tugas</p>
        </div>
      </div>

      <NilaiProgressClient
        byClass={JSON.parse(JSON.stringify(byClass))}
        examByClass={JSON.parse(JSON.stringify(examByClass))}
        taskByClass={JSON.parse(JSON.stringify(taskByClass))}
      />
    </div>
  );
}
