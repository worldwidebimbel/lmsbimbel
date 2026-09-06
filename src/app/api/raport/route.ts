import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const semester = searchParams.get("semester");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (session.user.role === "SISWA") {
    where.studentId = session.user.id;
    where.status = "PUBLISHED";
  } else if (session.user.role === "ORANG_TUA") {
    const children = await db.parentChild.findMany({
      where: { parentId: session.user.id },
      select: { childId: true },
    });
    where.studentId = { in: children.map((c) => c.childId) };
    where.status = "PUBLISHED";
  } else if (session.user.role === "GURU") {
    const teacherClasses = await db.class.findMany({
      where: { teacherId: session.user.id },
      select: { id: true },
    });
    where.classId = { in: teacherClasses.map((c) => c.id) };
  } else if (!isSuperAdmin && branchId) {
    where.branchId = branchId;
  }

  if (classId) where.classId = classId;
  if (studentId) where.studentId = studentId;
  if (semester) where.semester = semester;
  if (status) where.status = status;

  const raports = await db.raport.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, subject: { select: { name: true } } } },
      academicYear: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(raports);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  if (session.user.role === "GURU" && cls.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Bukan kelas Anda" }, { status: 403 });
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

    const existing = await db.raport.findFirst({
      where: { studentId, classId, semester, period: period ?? null },
    });

    const raportData = {
      finalGrade,
      predicate,
      gradeBreakdown: studentGrades,
      attendanceSummary,
      academicYearId: academicYearId ?? cls.academicYearId,
    };

    const raport = existing
      ? await db.raport.update({ where: { id: existing.id }, data: raportData })
      : await db.raport.create({
          data: {
            studentId,
            classId,
            branchId: cls.branchId,
            semester,
            period: period ?? null,
            ...raportData,
            status: "DRAFT",
          },
        });

    results.push({ studentId, raportId: raport.id, finalGrade });
  }

  await logAudit({ entity: "Raport", entityId: `class-${classId}-${semester}`, action: "CREATE", after: { classId, semester, generated: results.length } });
  return NextResponse.json({ generated: results.length, results }, { status: 201 });
}
