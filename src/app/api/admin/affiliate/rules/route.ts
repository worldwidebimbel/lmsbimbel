import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");

  const where: Record<string, unknown> = {};
  if (isActive !== null && isActive !== undefined && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const rules = await db.commissionRule.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: { program: { select: { id: true, name: true } } },
  });

  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { type, programId, nominal, percentage, stage, priority, isActive } = body;

  if (!type) {
    return NextResponse.json({ error: "Tipe aturan wajib diisi" }, { status: 400 });
  }

  const rule = await db.commissionRule.create({
    data: {
      type,
      programId: programId || null,
      nominal: nominal ?? null,
      percentage: percentage ?? null,
      stage: stage || null,
      priority: priority ?? 0,
      isActive: isActive ?? true,
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "CommissionRule",
    entityId: rule.id,
    after: rule,
  });

  return NextResponse.json(rule, { status: 201 });
}
