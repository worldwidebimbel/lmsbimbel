import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;

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

  // Admin / super admin: can chat with anyone (return empty for now)
  return NextResponse.json([]);
}
