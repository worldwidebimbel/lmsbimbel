import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Users, BookOpen, CheckSquare, GraduationCap, TrendingUp, Wallet, FileText, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Analitik" };

async function getAnalyticsData() {
  const [
    totalStudents,
    totalTeachers,
    activeClasses,
    totalMaterials,
    totalAssignments,
    totalSubmissions,
    gradedSubmissions,
    attendanceStats,
    gradeStats,
    invoiceStats,
    classStats,
    recentActivity,
  ] = await Promise.all([
    db.user.count({ where: { role: "SISWA", isActive: true } }),
    db.user.count({ where: { role: "GURU", isActive: true } }),
    db.class.count({ where: { isActive: true } }),
    db.material.count({ where: { isPublished: true } }),
    db.assignment.count({ where: { isPublished: true } }),
    db.submission.count(),
    db.submission.count({ where: { score: { not: null } } }),
    db.attendanceRecord.groupBy({ by: ["status"], _count: true }),
    db.submission.aggregate({ _avg: { score: true }, _count: true }),
    db.invoice.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
    db.class.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true,
        subject: { select: { name: true, color: true } },
        teacher: { select: { name: true } },
        _count: { select: { students: true, materials: true, assignments: true } },
      },
      orderBy: { students: { _count: "desc" } },
      take: 8,
    }),
    db.submission.findMany({
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        student: { select: { name: true } },
        assignment: { select: { title: true } },
      },
    }),
  ]);

  const attendanceMap = Object.fromEntries(attendanceStats.map((s) => [s.status, s._count]));
  const totalAttendance = Object.values(attendanceMap).reduce((a, b) => a + b, 0);

  const paidAmount = invoiceStats.find((i) => i.status === "PAID")?._sum.amount ?? 0;
  const unpaidAmount = invoiceStats.find((i) => i.status === "UNPAID")?._sum.amount ?? 0;

  return {
    totalStudents, totalTeachers, activeClasses, totalMaterials,
    totalAssignments, totalSubmissions, gradedSubmissions,
    attendanceMap, totalAttendance,
    avgGrade: gradeStats._avg.score ?? 0,
    totalGrades: gradeStats._count,
    paidAmount, unpaidAmount,
    classStats, recentActivity,
    submissionRate: totalAssignments > 0 ? Math.round((totalSubmissions / (totalAssignments * totalStudents || 1)) * 100) : 0,
    gradingRate: totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0,
    hadir: attendanceMap["HADIR"] ?? 0,
    absentRate: totalAttendance > 0
      ? Math.round(((attendanceMap["ALPHA"] ?? 0) / totalAttendance) * 100)
      : 0,
  };
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const d = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
            <p className="text-sm text-gray-500">Ringkasan performa lembaga</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/analytics/teachers" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Kinerja Guru <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/admin/analytics/classes" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Statistik Per Kelas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Siswa Aktif",     value: d.totalStudents,              icon: Users,       color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Guru Aktif",      value: d.totalTeachers,              icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Kelas Aktif",     value: d.activeClasses,              icon: BookOpen,    color: "text-green-600",  bg: "bg-green-50" },
          { label: "Materi Terbit",   value: d.totalMaterials,             icon: FileText,    color: "text-teal-600",   bg: "bg-teal-50" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="mt-0.5 text-sm text-gray-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Learning & Finance Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Tugas & Submission */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Tugas</h3>
          </div>
          <div className="space-y-3">
            <Stat label="Tugas terbit" value={d.totalAssignments} />
            <Stat label="Total pengumpulan" value={d.totalSubmissions} />
            <Stat label="Sudah dinilai" value={`${d.gradedSubmissions} (${d.gradingRate}%)`} />
          </div>
          <ProgressBar label="Tingkat penilaian" value={d.gradingRate} color="bg-blue-500" />
        </div>

        {/* Absensi */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Absensi</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "HADIR",  label: "Hadir",     color: "text-green-600"  },
              { key: "SAKIT",  label: "Sakit",     color: "text-yellow-600" },
              { key: "IZIN",   label: "Izin",      color: "text-blue-600"   },
              { key: "ALPHA",  label: "Alpha",     color: "text-red-600"    },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className={`font-semibold ${color}`}>{d.attendanceMap[key] ?? 0}</span>
              </div>
            ))}
          </div>
          <ProgressBar
            label={`Kehadiran ${d.totalAttendance > 0 ? Math.round(((d.attendanceMap["HADIR"] ?? 0) / d.totalAttendance) * 100) : 0}%`}
            value={d.totalAttendance > 0 ? Math.round(((d.attendanceMap["HADIR"] ?? 0) / d.totalAttendance) * 100) : 0}
            color="bg-green-500"
          />
        </div>

        {/* Keuangan */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Keuangan</h3>
          </div>
          <div className="space-y-3">
            <Stat label="Terbayar" value={formatCurrency(d.paidAmount)} valueClass="text-green-600" />
            <Stat label="Belum terbayar" value={formatCurrency(d.unpaidAmount)} valueClass="text-orange-600" />
            <Stat label="Rata-rata nilai" value={d.avgGrade ? `${d.avgGrade.toFixed(1)} / 100` : "—"} />
          </div>
          {d.paidAmount + d.unpaidAmount > 0 && (
            <ProgressBar
              label={`Terkumpul ${Math.round((d.paidAmount / (d.paidAmount + d.unpaidAmount)) * 100)}%`}
              value={Math.round((d.paidAmount / (d.paidAmount + d.unpaidAmount)) * 100)}
              color="bg-orange-500"
            />
          )}
        </div>
      </div>

      {/* Class Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <TrendingUp className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Kelas Aktif (Top 8)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kelas</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Guru</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Siswa</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Materi</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Tugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {d.classStats.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">Belum ada kelas aktif</td></tr>
              ) : (
                d.classStats.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cls.subject.color }} />
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-xs text-gray-400">{cls.subject.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cls.teacher.name}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{cls._count.students}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{cls._count.materials}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{cls._count.assignments}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Submissions */}
      {d.recentActivity.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Pengumpulan Tugas Terbaru</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {d.recentActivity.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{sub.student.name}</p>
                  <p className="text-xs text-gray-400">{sub.assignment.title}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sub.score !== null ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {sub.score !== null ? `Nilai: ${sub.score}` : "Menunggu penilaian"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, valueClass = "text-gray-900" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="pt-1">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
