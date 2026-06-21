import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;
  const { branchId, isSuperAdmin } = await getBranchScope();

  if (role === "SISWA") {
    const enrolled = await db.classStudent.findMany({
      where: { studentId: userId },
      include: { class: { include: { teacher: { select: { id: true, name: true, avatar: true, role: true } } } } },
    });
    const teachers = Array.from(
      new Map(enrolled.map((e) => [e.class.teacherId, e.class.teacher])).entries()
    ).map(([, t]) => t);
    return NextResponse.json(teachers);
  }

  if (role === "GURU") {
    const classes = await db.class.findMany({
      where: { teacherId: userId, isActive: true },
      include: { students: { include: { student: { select: { id: true, name: true, avatar: true, role: true } } } } },
    });
    const studentMap = new Map<string, { id: string; name: string; avatar: string | null; role: string }>();
    for (const cls of classes) {
      for (const cs of cls.students) {
        studentMap.set(cs.studentId, cs.student);
      }
    }
    return NextResponse.json(Array.from(studentMap.values()));
  }

  if (role === "ORANG_TUA") {
    const children = await db.parentChild.findMany({
      where: {
        parentId: userId,
        child: branchId && !isSuperAdmin ? { defaultBranchId: branchId } : {},
      },
      select: { childId: true },
    });
    const childIds = children.map((c) => c.childId);
    const enrolled = await db.classStudent.findMany({
      where: { studentId: { in: childIds } },
      include: { class: { include: { teacher: { select: { id: true, name: true, avatar: true, role: true } } } } },
    });
    const teacherMap = new Map(enrolled.map((e) => [e.class.teacherId, e.class.teacher]));
    return NextResponse.json(Array.from(teacherMap.values()));
  }

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    const users = await db.user.findMany({
      where: {
        isActive: true,
        id: { not: userId },
        role: { in: ["ADMIN", "GURU", "SISWA", "ORANG_TUA"] },
        ...(isSuperAdmin ? {} : branchId ? { defaultBranchId: branchId } : {}),
      },
      select: { id: true, name: true, avatar: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  }

  return NextResponse.json([]);
}
