import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const role = session.user.role;

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

  const body = await req.json();
  const { title, description, classId, subjectId, type, fileUrl, fileSize, duration, order } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title dan type wajib diisi" }, { status: 400 });
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
    },
  });

  return NextResponse.json(material, { status: 201 });
}
