import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ensureDefaultRubric, MAX_STARS, type RubricTypeValue } from "@/lib/raport-rubric";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"];
const READ_ROLES = [...MANAGE_ROLES, "ADMIN_CABANG", "GURU"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !READ_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (MANAGE_ROLES.includes(session.user.role)) {
    await ensureDefaultRubric();
  }

  const [levels, aspects] = await Promise.all([
    db.rubricLevel.findMany({
      where: type === "ACADEMIC" || type === "ATTITUDE" ? { type } : undefined,
      orderBy: [{ type: "asc" }, { stars: "desc" }],
    }),
    db.attitudeAspect.findMany({ orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({ levels, aspects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { type, stars, minScore, maxScore, category, description, colorHex } = body;

  if (type !== "ACADEMIC" && type !== "ATTITUDE") {
    return NextResponse.json({ error: "type harus ACADEMIC atau ATTITUDE" }, { status: 400 });
  }

  const starsNum = Number(stars);
  if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > MAX_STARS) {
    return NextResponse.json({ error: `stars harus bilangan bulat 1-${MAX_STARS}` }, { status: 400 });
  }

  if (!category?.trim()) {
    return NextResponse.json({ error: "category wajib diisi" }, { status: 400 });
  }

  const min = Number(minScore);
  const max = Number(maxScore);
  if (Number.isNaN(min) || Number.isNaN(max) || min > max) {
    return NextResponse.json({ error: "Rentang nilai tidak valid" }, { status: 400 });
  }

  const existing = await db.rubricLevel.findUnique({
    where: { type_stars: { type: type as RubricTypeValue, stars: starsNum } },
  });
  if (existing) {
    return NextResponse.json({ error: `Level bintang ${starsNum} untuk tipe ini sudah ada` }, { status: 409 });
  }

  const level = await db.rubricLevel.create({
    data: {
      type: type as RubricTypeValue,
      stars: starsNum,
      minScore: min,
      maxScore: max,
      category: category.trim(),
      description: description?.trim() || null,
      colorHex: colorHex?.trim() || null,
      order: MAX_STARS - starsNum,
    },
  });

  await logAudit({ entity: "RubricLevel", entityId: level.id, action: "CREATE", after: { type, stars: starsNum, category } });
  return NextResponse.json(level, { status: 201 });
}
