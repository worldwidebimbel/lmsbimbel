import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { MAX_STARS } from "@/lib/raport-rubric";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const level = await db.rubricLevel.findUnique({ where: { id } });
  if (!level) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { stars, minScore, maxScore, category, description, colorHex, isActive } = body;

  const data: Record<string, unknown> = {};

  if (stars !== undefined) {
    const starsNum = Number(stars);
    if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > MAX_STARS) {
      return NextResponse.json({ error: `stars harus bilangan bulat 1-${MAX_STARS}` }, { status: 400 });
    }
    if (starsNum !== level.stars) {
      const clash = await db.rubricLevel.findUnique({
        where: { type_stars: { type: level.type, stars: starsNum } },
      });
      if (clash) {
        return NextResponse.json({ error: `Level bintang ${starsNum} sudah dipakai` }, { status: 409 });
      }
    }
    data.stars = starsNum;
    data.order = MAX_STARS - starsNum;
  }

  const nextMin = minScore !== undefined ? Number(minScore) : level.minScore;
  const nextMax = maxScore !== undefined ? Number(maxScore) : level.maxScore;
  if (Number.isNaN(nextMin) || Number.isNaN(nextMax) || nextMin > nextMax) {
    return NextResponse.json({ error: "Rentang nilai tidak valid" }, { status: 400 });
  }
  if (minScore !== undefined) data.minScore = nextMin;
  if (maxScore !== undefined) data.maxScore = nextMax;

  if (category !== undefined) {
    if (!category?.trim()) return NextResponse.json({ error: "category wajib diisi" }, { status: 400 });
    data.category = category.trim();
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (colorHex !== undefined) data.colorHex = colorHex?.trim() || null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const updated = await db.rubricLevel.update({ where: { id }, data });

  await logAudit({
    entity: "RubricLevel",
    entityId: id,
    action: "UPDATE",
    before: { stars: level.stars, category: level.category, minScore: level.minScore, maxScore: level.maxScore },
    after: data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const level = await db.rubricLevel.findUnique({ where: { id } });
  if (!level) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.rubricLevel.delete({ where: { id } });
  await logAudit({ entity: "RubricLevel", entityId: id, action: "DELETE", before: { type: level.type, stars: level.stars } });
  return NextResponse.json({ success: true });
}
