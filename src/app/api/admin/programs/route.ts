import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const isActive = searchParams.get("isActive");

  const programs = await db.program.findMany({
    where: isActive === "true" ? { isActive: true } : isActive === "false" ? { isActive: false } : {},
    include: {
      branches: { select: { id: true, name: true, code: true } },
      educationLevels: { select: { id: true, name: true, code: true } },
      levels: { orderBy: { order: "asc" } },
      _count: { select: { classes: true, invoices: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    slug,
    name,
    description,
    targetAudience,
    materials,
    benefits,
    duration,
    price,
    promoPrice,
    promoUntil,
    branchIds,
    educationLevelIds,
    order,
  } = body;

  if (!slug || !name) {
    return NextResponse.json({ error: "slug dan name wajib diisi" }, { status: 400 });
  }

  try {
    const program = await db.program.create({
      data: {
        slug: slug.toLowerCase().replace(/\s+/g, "-"),
        name,
        description: description || null,
        targetAudience: targetAudience || null,
        materials: materials || null,
        benefits: benefits || undefined,
        duration: duration || null,
        price: price ?? 0,
        promoPrice: promoPrice ?? null,
        promoUntil: promoUntil ? new Date(promoUntil) : null,
        order: order ?? 0,
        branches: branchIds?.length
          ? { connect: branchIds.map((id: string) => ({ id })) }
          : undefined,
        educationLevels: educationLevelIds?.length
          ? { connect: educationLevelIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        branches: { select: { id: true, name: true, code: true } },
        educationLevels: { select: { id: true, name: true, code: true, order: true, isActive: true } },
        levels: { orderBy: { order: "asc" } },
        _count: { select: { classes: true, invoices: true } },
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "Program",
      entityId: program.id,
      after: program,
    });

    return NextResponse.json(program, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Slug sudah digunakan atau data tidak valid" },
      { status: 409 }
    );
  }
}
