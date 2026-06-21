import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const role = session.user.role;
  const { isSuperAdmin, branchId } = await getBranchScope();

  let where: Record<string, unknown> = { isPublished: true };

  if (role === "GURU") {
    where = { uploaderId: session.user.id };
  } else if (role === "SISWA") {
    where = {
      isPublished: true,
      ...(classId && { classId }),
      ...(subjectId && { subjectId }),
    };
  } else if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
    where = {};
  }

  if (classId) where.classId = classId;
  if (subjectId) where.subjectId = subjectId;

  if (!isSuperAdmin && branchId) {
    const branchClassIds = (await db.class.findMany({ where: { branchId }, select: { id: true } })).map((c) => c.id);
    where.OR = [
      { classId: { in: branchClassIds } },
      { classId: null },
    ];
  }

  const materials = await db.material.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, color: true, code: true } },
      class: { select: { id: true, name: true } },
      uploader: { select: { id: true, name: true } },
      _count: { select: { progress: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { title, description, classId, subjectId, type, fileUrl, fileSize, duration, order } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title dan type wajib diisi" }, { status: 400 });
  }

  if (classId && !isSuperAdmin) {
    const cls = await db.class.findUnique({ where: { id: classId }, select: { branchId: true } });
    if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    if (branchId && cls.branchId !== branchId) {
      return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
    }
  }

  const material = await db.material.create({
    data: {
      title,
      description,
      classId: classId || null,
      subjectId: subjectId || null,
      uploaderId: session.user.id,
      type,
      fileUrl,
      fileSize,
      duration,
      order: order ?? 0,
      isPublished: false,
    },
    include: {
      subject: { select: { name: true, color: true } },
      class: { select: { name: true } },
      _count: { select: { progress: true } },
    },
  });

  return NextResponse.json(material, { status: 201 });
}
