import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ClassStatsClient from "@/components/admin/ClassStatsClient";

export const metadata = { title: "Statistik Per Kelas" };

export default async function ClassAnalyticsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { branchId } = await getBranchScope();
  const classWhere = branchId ? { isActive: true, branchId } : { isActive: true };

  const classes = await db.class.findMany({
    where: classWhere,
    select: {
      id: true, name: true,
      subject: { select: { name: true, color: true } },
      teacher: { select: { name: true } },
      _count: { select: { students: true, materials: true, assignments: true } },
    },
    orderBy: { name: "asc" },
  });

  const classStats = await Promise.all(
    classes.map(async (cls) => {
      const studentIds = (await db.classStudent.findMany({
        where: { classId: cls.id },
        select: { studentId: true },
      })).map((s) => s.studentId);

      const [avgGrade, attendanceRecords, submissionCount, examAttempts] = await Promise.all([
        db.grade.aggregate({
          where: { studentId: { in: studentIds }, component: { classId: cls.id } },
          _avg: { score: true },
          _count: true,
        }),
        db.attendanceRecord.findMany({
          where: { studentId: { in: studentIds } },
          select: { status: true },
        }),
        db.submission.count({
          where: { studentId: { in: studentIds }, assignment: { classId: cls.id } } },
        ),
        db.examAttempt.count({
          where: { studentId: { in: studentIds }, exam: { classId: cls.id }, isCompleted: true } },
        ),
      ]);

      const totalAttendance = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((r) => r.status === "HADIR").length;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      return {
        id: cls.id,
        name: cls.name,
        subject: cls.subject.name,
        subjectColor: cls.subject.color,
        teacher: cls.teacher.name,
        studentCount: cls._count.students,
        materialCount: cls._count.materials,
        assignmentCount: cls._count.assignments,
        avgGrade: avgGrade._avg.score ?? 0,
        gradeCount: avgGrade._count,
        attendanceRate,
        totalAttendance,
        submissionCount,
        examAttempts,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistik Per Kelas</h1>
          <p className="text-sm text-gray-500">Kehadiran, nilai, dan aktivitas per kelas</p>
        </div>
      </div>

      <ClassStatsClient data={JSON.parse(JSON.stringify(classStats))} />
    </div>
  );
}
