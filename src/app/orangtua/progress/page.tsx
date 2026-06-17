import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BarChart3, BookOpen, ClipboardList, FileCheck, CheckSquare, GraduationCap } from "lucide-react";

export const metadata = { title: "Progress Anak" };

export default async function OrangtuaProgressPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const children = await db.parentChild.findMany({
    where: { parentId: session.user.id },
    include: { child: { select: { id: true, name: true, email: true } } },
  });

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Belum ada data anak yang terhubung.</p>
      </div>
    );
  }

  const childId = children[0].child.id;
  const child = children[0].child;

  const [enrolledClasses, submissions, examAttempts, attendanceRecords, grades] = await Promise.all([
    db.classStudent.findMany({
      where: { studentId: childId },
      include: { class: { select: { name: true, subject: { select: { name: true, color: true } } } } },
    }),
    db.submission.findMany({
      where: { studentId: childId },
      include: { assignment: { select: { title: true, dueDate: true, maxScore: true } } },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
    db.examAttempt.findMany({
      where: { studentId: childId, isCompleted: true },
      include: { exam: { select: { title: true, passingScore: true } } },
      orderBy: { submittedAt: "desc" },
      take: 8,
    }),
    db.attendanceRecord.groupBy({
      by: ["status"],
      where: { studentId: childId },
      _count: true,
    }),
    db.grade.findMany({
      where: { studentId: childId },
      include: { component: { select: { name: true, class: { select: { subject: { select: { name: true, color: true } } } } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const totalAttendance = attendanceRecords.reduce((s, r) => s + r._count, 0);
  const hadirCount = attendanceRecords.find((r) => r.status === "HADIR")?._count ?? 0;
  const attendancePct = totalAttendance > 0 ? Math.round((hadirCount / totalAttendance) * 100) : 0;

  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const avgScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((s, sub) => s + (sub.score ?? 0), 0) / gradedSubmissions.length)
    : null;

  const passedExams = examAttempts.filter((a) => (a.score ?? 0) >= a.exam.passingScore).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress {child.name}</h1>
          <p className="text-sm text-gray-500">{enrolledClasses.length} kelas aktif</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Kehadiran", value: `${attendancePct}%`, sub: `${hadirCount}/${totalAttendance}`, color: "text-green-600", bg: "bg-green-50", Icon: CheckSquare },
          { label: "Rata-rata Tugas", value: avgScore !== null ? `${avgScore}` : "—", sub: `${gradedSubmissions.length} dinilai`, color: "text-blue-600", bg: "bg-blue-50", Icon: ClipboardList },
          { label: "Ujian Lulus", value: `${passedExams}/${examAttempts.length}`, sub: "ujian selesai", color: "text-indigo-600", bg: "bg-indigo-50", Icon: FileCheck },
          { label: "Kelas", value: enrolledClasses.length, sub: "terdaftar", color: "text-purple-600", bg: "bg-purple-50", Icon: BookOpen },
        ].map((s) => {
          const Icon = s.Icon;
          return (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kelas terdaftar */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Kelas Terdaftar</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {enrolledClasses.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-gray-400">Belum terdaftar di kelas apapun</p>
            ) : enrolledClasses.map((ec) => (
              <div key={ec.classId} className="flex items-center gap-3 px-5 py-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ec.class.subject.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ec.class.name}</p>
                  <p className="text-xs text-gray-400">{ec.class.subject.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nilai terbaru */}
        {grades.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Nilai Terbaru</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {grades.map((g) => (
                <div key={g.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: g.component.class.subject.color }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{g.component.class.subject.name}</p>
                      <p className="text-xs text-gray-400">{g.component.name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${g.score >= 75 ? "text-green-600" : g.score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                    {g.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ujian terakhir */}
        {examAttempts.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Hasil Ujian</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {examAttempts.map((a) => {
                const passed = (a.score ?? 0) >= a.exam.passingScore;
                return (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.exam.title}</p>
                      <p className="text-xs text-gray-400">KKM {a.exam.passingScore}%</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${passed ? "text-green-600" : "text-red-500"}`}>{a.score ?? 0}%</p>
                      <p className={`text-xs ${passed ? "text-green-500" : "text-red-400"}`}>{passed ? "Lulus" : "Tidak Lulus"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tugas terbaru */}
        {submissions.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Tugas Terbaru</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{s.assignment.title}</p>
                    <p className="text-xs text-gray-400">
                      {s.assignment.maxScore ? `Maks. ${s.assignment.maxScore}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.score !== null ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {s.score !== null ? `${s.score}` : "Menunggu"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
