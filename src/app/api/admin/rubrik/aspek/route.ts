import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"];
const READ_ROLES = [...MANAGE_ROLES, "ADMIN_CABANG", "GURU"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !READ_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const aspects = await db.attitudeAspect.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(aspects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, weight } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nama aspek wajib diisi" }, { status: 400 });
  }

  const weightNum = weight === undefined || weight === null || weight === "" ? 1 : Number(weight);
  if (Number.isNaN(weightNum) || weightNum <= 0) {
    return NextResponse.json({ error: "Bobot harus angka lebih dari 0" }, { status: 400 });
  }

  const last = await db.attitudeAspect.findFirst({ orderBy: { order: "desc" }, select: { order: true } });

  const aspect = await db.attitudeAspect.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      weight: weightNum,
      order: (last?.order ?? -1) + 1,
    },
  });

  await logAudit({ entity: "AttitudeAspect", entityId: aspect.id, action: "CREATE", after: { name: aspect.name } });
  return NextResponse.json(aspect, { status: 201 });
}
