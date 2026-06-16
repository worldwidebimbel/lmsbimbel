import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BarChart3, Trophy } from "lucide-react";

export const metadata = { title: "Nilai" };

export default async function SiswaNilaiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const grades = await db.grade.findMany({
    where: { studentId: session.user.id },
    include: {
      component: {
        include: { class: { select: { id: true, name: true } } },
      },
    },
    orderBy: { component: { order: "asc" } },
  });

  const byClass: Record<string, { className: string; components: { name: string; weight: number; period: string | null; score: number }[] }> = {};
  for (const g of grades) {
    const classId = g.component.classId;
    if (!byClass[classId]) {
      byClass[classId] = { className: g.component.class.name, components: [] };
    }
    byClass[classId].components.push({
      name: g.component.name,
      weight: g.component.weight,
      period: g.component.period,
      score: g.score,
    });
  }

  function calcNA(components: { weight: number; score: number }[]) {
    if (components.length === 0) return null;
    const totalWeight = components.reduce((s, c) => s + c.weight, 0);
    const totalScore = components.reduce((s, c) => s + c.score * c.weight, 0);
    return totalWeight > 0 ? totalScore / totalWeight : null;
  }

  const classEntries = Object.entries(byClass);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nilai Saya</h1>
          <p className="text-sm text-gray-500">Rekap nilai per mata pelajaran</p>
        </div>
      </div>

      {classEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <BarChart3 className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada nilai yang diinput guru</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classEntries.map(([classId, data]) => {
            const na = calcNA(data.components);
            return (
              <div key={classId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{data.className}</h3>
                  {na !== null && (
                    <div className="flex items-center gap-2">
                      {na >= 90 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      <span className={`text-base font-bold ${na >= 75 ? "text-green-600" : "text-red-600"}`}>
                        NA: {na.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {data.components.map((comp) => (
                    <div key={comp.name} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{comp.name}</p>
                        <p className="text-xs text-gray-400">
                          Bobot: {comp.weight}x{comp.period ? ` · ${comp.period}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${comp.score >= 75 ? "text-green-600" : "text-red-600"}`}>
                          {comp.score}
                        </p>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${comp.score >= 75 ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(comp.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
