import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { FileText, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Detail Raport Anak" };

export default async function OrangTuaRaportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const { id } = await params;

  const raport = await db.raport.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      student: { select: { id: true, name: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
        },
      },
      academicYear: { select: { id: true, name: true } },
    },
  });

  if (!raport) redirect("/orangtua/raport");

  const child = await db.parentChild.findFirst({
    where: { parentId: session.user.id, childId: raport.studentId },
  });

  if (!child) redirect("/orangtua/raport");

  const PREDICATE_COLORS: Record<string, string> = {
    A: "bg-green-100 text-green-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-yellow-100 text-yellow-700",
    D: "bg-orange-100 text-orange-700",
    E: "bg-red-100 text-red-700",
  };

  const gradeBreakdown = (raport.gradeBreakdown as Array<{ component: string; weight: number; score: number | null }>) ?? [];
  const attendanceSummary = (raport.attendanceSummary as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/orangtua/raport" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Raport</h1>
          <p className="text-sm text-gray-500">{raport.student.name}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{raport.class.name}</h2>
            <p className="text-sm text-gray-500">{raport.class.subject.name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Semester {raport.semester}</span>
              {raport.period && <span>• {raport.period}</span>}
              {raport.academicYear && <span>• {raport.academicYear.name}</span>}
              <span>• Tutor: {raport.class.teacher.name}</span>
            </div>
          </div>
          {raport.finalGrade !== null && (
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{raport.finalGrade.toFixed(1)}</p>
              {raport.predicate && (
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${PREDICATE_COLORS[raport.predicate] ?? "bg-gray-100"}`}>
                  {raport.predicate}
                </span>
              )}
            </div>
          )}
        </div>

        {gradeBreakdown.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Rincian Nilai</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Komponen</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Bobot</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gradeBreakdown.map((g, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-800">{g.component}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{g.weight}%</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {g.score !== null ? g.score.toFixed(1) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {Object.keys(attendanceSummary).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Rekap Kehadiran</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(attendanceSummary).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{val}</p>
                  <p className="text-xs text-gray-500">{key}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {raport.teacherNote && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Catatan Tutor</h3>
            <p className="text-sm text-gray-600 italic">"{raport.teacherNote}"</p>
          </div>
        )}

        {raport.principalNote && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Catatan Kepala Lembaga</h3>
            <p className="text-sm text-gray-600 italic">"{raport.principalNote}"</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <a
            href={`/api/raport/${raport.id}/pdf`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
