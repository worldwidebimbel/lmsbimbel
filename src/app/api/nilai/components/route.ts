import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "classId required" }, { status: 400 });

  const components = await db.gradeComponent.findMany({
    where: { classId },
    include: { _count: { select: { grades: true } } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(components);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { classId, name, weight, period } = body;

  if (!classId || !name) {
    return NextResponse.json({ error: "classId dan name wajib diisi" }, { status: 400 });
  }

  const count = await db.gradeComponent.count({ where: { classId } });

  const component = await db.gradeComponent.create({
    data: {
      classId,
      name,
      weight: weight ?? 1,
      period: period ?? null,
      order: count,
    },
  });

  await logAudit({ entity: "GradeComponent", entityId: component.id, action: "CREATE", after: { classId, name } });
  return NextResponse.json(component, { status: 201 });
}
