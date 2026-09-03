import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { TrendingUp, BookOpen, ClipboardList, FileCheck, CalendarDays, Award } from "lucide-react";

const ProgressClient = dynamic(() => import("@/components/siswa/ProgressClient"), { loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-lg" /> });

export const metadata = { title: "Progress Belajar" };

export default async function SiswaProgressPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");
  const userId = session.user.id;

  const [materialProgress, submissions, examAttempts, grades, attendanceRecords] = await Promise.all([
    db.materialProgress.count({ where: { studentId: userId, isCompleted: true } }),
    db.submission.findMany({
      where: { studentId: userId },
      select: { score: true, submittedAt: true },
      orderBy: { submittedAt: "asc" },
    }),
    db.examAttempt.findMany({
      where: { studentId: userId, isCompleted: true },
      select: { score: true, submittedAt: true },
      orderBy: { submittedAt: "asc" },
    }),
    db.grade.findMany({
      where: { studentId: userId },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.attendanceRecord.findMany({
      where: { studentId: userId },
      select: { status: true },
    }),
  ]);

  const totalMaterials = materialProgress;
  const totalSubmissions = submissions.length;
  const avgSubmissionScore = totalSubmissions > 0
    ? submissions.reduce((s, c) => s + (c.score ?? 0), 0) / totalSubmissions
    : null;

  const totalExams = examAttempts.length;
  const avgExamScore = totalExams > 0
    ? examAttempts.reduce((s, c) => s + (c.score ?? 0), 0) / totalExams
    : null;

  const totalGrades = grades.length;
  const avgGrade = totalGrades > 0
    ? grades.reduce((s, c) => s + c.score, 0) / totalGrades
    : null;

  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === "HADIR").length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : null;

  // Weekly activity data: last 8 weeks
  const now = new Date();
  const weeks: { label: string; materi: number; tugas: number; ujian: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const label = `Minggu ${8 - i}`;
    weeks.push({
      label,
      materi: 0, // materialProgress tidak ada createdAt per record, kita skip
      tugas: submissions.filter((s) => s.submittedAt && s.submittedAt >= start && s.submittedAt < end).length,
      ujian: examAttempts.filter((e) => e.submittedAt && e.submittedAt >= start && e.submittedAt < end).length,
    });
  }

  const stats = {
    totalMaterials,
    totalSubmissions,
    avgSubmissionScore,
    totalExams,
    avgExamScore,
    avgGrade,
    attendanceRate,
    weeks,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Belajar</h1>
          <p className="text-sm text-gray-500">Statistik dan perkembangan belajarmu</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5 text-blue-600" />} label="Materi Selesai" value={totalMaterials} bg="bg-blue-50" />
        <StatCard icon={<ClipboardList className="h-5 w-5 text-purple-600" />} label="Tugas Dikumpulkan" value={totalSubmissions} bg="bg-purple-50" />
        <StatCard icon={<FileCheck className="h-5 w-5 text-orange-600" />} label="Ujian Dikerjakan" value={totalExams} bg="bg-orange-50" />
        <StatCard icon={<CalendarDays className="h-5 w-5 text-green-600" />} label="Kehadiran" value={attendanceRate !== null ? `${attendanceRate.toFixed(0)}%` : "-"} bg="bg-green-50" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Rata-rata Nilai Tugas" score={avgSubmissionScore} />
        <ScoreCard label="Rata-rata Nilai Ujian" score={avgExamScore} />
        <ScoreCard label="Rata-rata Nilai Akhir" score={avgGrade} />
      </div>

      <ProgressClient weeks={weeks} />
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${score !== null && score >= 75 ? "text-green-600" : score !== null ? "text-red-600" : "text-gray-500"}`}>
        {score !== null ? score.toFixed(1) : "-"}
      </p>
    </div>
  );
}
