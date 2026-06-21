import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { GraduationCap, Users2 } from "lucide-react";

export const metadata = { title: "Nilai Anak" };

export default async function OrangtuaNilaiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const { branchId } = await getBranchScope();
  const children = await db.parentChild.findMany({
    where: {
      parentId: session.user.id,
      child: branchId ? { defaultBranchId: branchId } : {},
    },
    include: { child: { select: { id: true, name: true } } },
  });

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Users2 className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Belum ada anak yang terhubung.</p>
      </div>
    );
  }

  const childIds = children.map((c) => c.child.id);

  const grades = await db.grade.findMany({
    where: { studentId: { in: childIds } },
    include: {
      student: { select: { id: true, name: true } },
      component: {
        include: { class: { include: { subject: { select: { name: true } } } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const byChild: Record<string, typeof grades> = {};
  for (const g of grades) {
    if (!byChild[g.studentId]) byChild[g.studentId] = [];
    byChild[g.studentId].push(g);
  }

  // Group by subject per child
  function groupBySubject(childGrades: typeof grades) {
    const map: Record<string, { subject: string; scores: number[]; avg: number }> = {};
    for (const g of childGrades) {
      const subj = g.component.class.subject.name;
      if (!map[subj]) map[subj] = { subject: subj, scores: [], avg: 0 };
      map[subj].scores.push(g.score);
    }
    for (const key of Object.keys(map)) {
      const arr = map[key].scores;
      map[key].avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    return Object.values(map).sort((a, b) => a.subject.localeCompare(b.subject));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <GraduationCap className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nilai Anak</h1>
          <p className="text-sm text-gray-500">Rekap nilai per mata pelajaran</p>
        </div>
      </div>

      {children.map(({ child }) => {
        const childGrades = byChild[child.id] ?? [];
        const subjects = groupBySubject(childGrades);
        const overallAvg = subjects.length > 0 ? Math.round(subjects.reduce((s, g) => s + g.avg, 0) / subjects.length) : null;

        return (
          <div key={child.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {child.name.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="font-semibold text-gray-900">{child.name}</h2>
              </div>
              {overallAvg !== null && (
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${overallAvg >= 75 ? "bg-green-100 text-green-700" : overallAvg >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  Rata-rata: {overallAvg}
                </span>
              )}
            </div>

            {subjects.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">Belum ada data nilai</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {subjects.map((s) => {
                  const color = s.avg >= 75 ? "bg-green-500" : s.avg >= 60 ? "bg-yellow-500" : "bg-red-500";
                  const textColor = s.avg >= 75 ? "text-green-700" : s.avg >= 60 ? "text-yellow-700" : "text-red-700";
                  const bgColor = s.avg >= 75 ? "bg-green-100" : s.avg >= 60 ? "bg-yellow-100" : "bg-red-100";
                  return (
                    <div key={s.subject} className="px-5 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{s.subject}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${bgColor} ${textColor}`}>{s.avg}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(s.avg, 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{s.scores.length} komponen nilai</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
