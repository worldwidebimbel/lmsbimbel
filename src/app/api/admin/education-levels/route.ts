import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const levels = await db.educationLevel.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(levels);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, code, order } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "name dan code wajib diisi" }, { status: 400 });
  }

  try {
    const level = await db.educationLevel.create({
      data: {
        name,
        code: code.toUpperCase(),
        order: order ?? 0,
      },
    });
    await logAudit({
      entity: "EducationLevel",
      entityId: level.id,
      action: "CREATE",
      after: { name, code: code.toUpperCase() },
    });
    return NextResponse.json(level, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kode sudah digunakan" }, { status: 409 });
  }
}
