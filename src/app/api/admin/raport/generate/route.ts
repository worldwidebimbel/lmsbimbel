import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { classId, studentIds, semester, period, academicYearId } = body;

  if (!classId || !studentIds?.length || !semester) {
    return NextResponse.json({ error: "classId, studentIds, semester wajib diisi" }, { status: 400 });
  }

  const cls = await db.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true, branchId: true, academicYearId: true },
  });

  if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });

  if (!isSuperAdmin && branchId && cls.branchId !== branchId) {
    return NextResponse.json({ error: "Akses ditolak untuk kelas ini" }, { status: 403 });
  }

  const components = await db.gradeComponent.findMany({
    where: { classId },
    include: { grades: true },
  });

  const attendances = await db.attendance.findMany({
    where: { classId },
    include: { records: true },
  });

  const results: { studentId: string; raportId: string; finalGrade: number | null }[] = [];

  for (const studentId of studentIds as string[]) {
    const studentGrades = components.map((comp) => {
      const grade = comp.grades.find((g) => g.studentId === studentId);
      return {
        component: comp.name,
        weight: comp.weight,
        score: grade?.score ?? null,
      };
    });

    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = studentGrades.reduce((sum, g) => {
      if (g.score === null) return sum;
      return sum + g.score * g.weight;
    }, 0);
    const finalGrade = totalWeight > 0 ? weightedSum / totalWeight : null;

    const predicate = finalGrade === null ? null
      : finalGrade >= 90 ? "A"
      : finalGrade >= 80 ? "B"
      : finalGrade >= 70 ? "C"
      : finalGrade >= 60 ? "D"
      : "E";

    const studentRecords = attendances.flatMap((a) => a.records.filter((r) => r.studentId === studentId));
    const attendanceSummary = {
      HADIR: studentRecords.filter((r) => r.status === "HADIR").length,
      SAKIT: studentRecords.filter((r) => r.status === "SAKIT").length,
      IZIN: studentRecords.filter((r) => r.status === "IZIN").length,
      ALPHA: studentRecords.filter((r) => r.status === "ALPHA").length,
    };

    const raport = await db.raport.upsert({
      where: {
        studentId_classId_semester_period: {
          studentId,
          classId,
          semester,
          period: period ?? null,
        },
      },
      create: {
        studentId,
        classId,
        academicYearId: academicYearId ?? cls.academicYearId,
        branchId: cls.branchId,
        semester,
        period: period ?? null,
        finalGrade,
        predicate,
        gradeBreakdown: studentGrades,
        attendanceSummary,
        status: "DRAFT",
      },
      update: {
        finalGrade,
        predicate,
        gradeBreakdown: studentGrades,
        attendanceSummary,
        academicYearId: academicYearId ?? cls.academicYearId,
      },
    });

    results.push({ studentId, raportId: raport.id, finalGrade });
  }

  await logAudit({ entity: "Raport", entityId: `class-${classId}-${semester}`, action: "CREATE", after: { classId, semester, generated: results.length } });
  return NextResponse.json({ generated: results.length, results }, { status: 201 });
}
