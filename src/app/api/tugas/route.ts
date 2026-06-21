import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const { isSuperAdmin, branchId } = await getBranchScope();

  const where: Record<string, unknown> = {};

  if (session.user.role === "GURU") {
    where.teacherId = session.user.id;
  } else if (session.user.role === "SISWA") {
    where.isPublished = true;
    const enrolled = await prisma.classStudent.findMany({
      where: { studentId: session.user.id },
      select: { classId: true },
    });
    where.classId = { in: enrolled.map((e) => e.classId) };
  }

  if (classId) where.classId = classId;

  if (!isSuperAdmin && branchId) {
    where.class = { branchId };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { title, description, classId, dueDate, maxScore, fileUrl, isPublished } = body;

  if (!title || !classId || !dueDate) {
    return NextResponse.json({ error: "title, classId, dueDate wajib diisi" }, { status: 400 });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { branchId: true } });
  if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  if (!isSuperAdmin && branchId && cls.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      title,
      description,
      classId,
      teacherId: session.user.id,
      dueDate: new Date(dueDate),
      maxScore: maxScore ?? 100,
      fileUrl,
      isPublished: isPublished ?? false,
    },
    include: {
      class: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
