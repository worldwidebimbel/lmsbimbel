import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { FileText, Download } from "lucide-react";
import RaportRubricSummary from "@/components/raport/RaportRubricSummary";

export const metadata = { title: "Raport - Siswa" };

export default async function SiswaRaportPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const [raports, rubricLevels] = await Promise.all([
    db.raport.findMany({
      where: { studentId: session.user.id, status: "PUBLISHED" },
      include: {
        class: { select: { id: true, name: true, subject: { select: { name: true } }, teacher: { select: { name: true } } } },
        academicYear: { select: { id: true, name: true } },
        attitudes: { include: { aspect: { select: { id: true, name: true, order: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.rubricLevel.findMany({
      select: { type: true, stars: true, category: true, description: true, colorHex: true },
    }),
  ]);

  const PREDICATE_COLORS: Record<string, string> = {
    A: "bg-green-100 text-green-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-yellow-100 text-yellow-700",
    D: "bg-orange-100 text-orange-700",
    E: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raport Saya</h1>
          <p className="text-sm text-gray-500">Lihat raport yang telah dipublikasi</p>
        </div>
      </div>

      {raports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <FileText className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada raport yang dipublikasi.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {raports.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.class.name}</h3>
                  <p className="text-sm text-gray-500">{r.class.subject.name}</p>
                </div>
                {r.finalGrade !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{r.finalGrade.toFixed(1)}</p>
                    {r.predicate && (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${PREDICATE_COLORS[r.predicate] ?? "bg-gray-100"}`}>
                        {r.predicate}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Semester {r.semester}</span>
                {r.period && <span>• {r.period}</span>}
                {r.academicYear && <span>• {r.academicYear.name}</span>}
              </div>

              <RaportRubricSummary raport={r} rubricLevels={rubricLevels} />

              {r.teacherNote && (
                <p className="text-sm italic text-gray-600">&quot;{r.teacherNote}&quot;</p>
              )}

              <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500">Tutor: {r.class.teacher?.name ?? "—"}</span>
                <a
                  href={`/api/raport/${r.id}/pdf`}
                  className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
