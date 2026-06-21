import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import TeacherStatsClient from "@/components/admin/TeacherStatsClient";

export const metadata = { title: "Laporan Kinerja Guru" };

export default async function TeacherAnalyticsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { branchId } = await getBranchScope();
  const teacherWhere = branchId
    ? { role: UserRole.GURU, isActive: true, classes: { some: { branchId } } }
    : { role: UserRole.GURU, isActive: true };

  const teachers = await db.user.findMany({
    where: teacherWhere,
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const teacherStats = await Promise.all(
    teachers.map(async (teacher) => {
      const classWhere = branchId
        ? { teacherId: teacher.id, isActive: true, branchId }
        : { teacherId: teacher.id, isActive: true };

      const [classes, materials, assignments, exams, attendanceSessions] = await Promise.all([
        db.class.findMany({
          where: classWhere,
          select: { id: true, name: true, _count: { select: { students: true } } },
        }),
        db.material.count({ where: { class: classWhere } }),
        db.assignment.count({ where: { class: classWhere } }),
        db.exam.count({ where: { class: classWhere } }),
        db.attendance.count({ where: { class: classWhere } }),
      ]);

      const classIds = classes.map((c) => c.id);
      const studentIds = (await db.classStudent.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true },
      })).map((s) => s.studentId);

      const [avgGrade, submissions, gradedSubmissions] = await Promise.all([
        db.grade.aggregate({
          where: { component: { classId: { in: classIds } } },
          _avg: { score: true },
        }),
        db.submission.count({ where: { assignment: { class: classWhere } } }),
        db.submission.count({
          where: { assignment: { class: classWhere }, score: { not: null } },
        }),
      ]);

      const totalStudents = new Set(studentIds).size;
      const gradingRate = submissions > 0 ? (gradedSubmissions / submissions) * 100 : 0;

      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        avatar: teacher.avatar,
        classCount: classes.length,
        classes: classes.map((c) => ({ name: c.name, studentCount: c._count.students })),
        totalStudents,
        materialCount: materials,
        assignmentCount: assignments,
        examCount: exams,
        attendanceSessions,
        avgStudentGrade: avgGrade._avg.score ?? 0,
        submissionCount: submissions,
        gradedCount: gradedSubmissions,
        gradingRate,
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
          <h1 className="text-2xl font-bold text-gray-900">Laporan Kinerja Guru</h1>
          <p className="text-sm text-gray-500">Aktivitas mengajar, materi, penilaian per guru</p>
        </div>
      </div>

      <TeacherStatsClient data={JSON.parse(JSON.stringify(teacherStats))} />
    </div>
  );
}
