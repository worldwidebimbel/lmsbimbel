import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const program = await db.program.findUnique({
    where: { id },
    include: {
      branches: { select: { id: true, name: true, code: true } },
      educationLevels: { select: { id: true, name: true, code: true } },
      levels: { orderBy: { order: "asc" } },
      _count: { select: { classes: true, invoices: true } },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(program);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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
    isActive,
    order,
    branchIds,
    educationLevelIds,
  } = body;

  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
  }

  try {
    const program = await db.program.update({
      where: { id },
      data: {
        slug: slug ? slug.toLowerCase().replace(/\s+/g, "-") : undefined,
        name,
        description,
        targetAudience,
        materials,
        benefits,
        duration,
        price,
        promoPrice,
        promoUntil: promoUntil ? new Date(promoUntil) : undefined,
        isActive,
        order,
        branches: branchIds
          ? { set: branchIds.map((bid: string) => ({ id: bid })) }
          : undefined,
        educationLevels: educationLevelIds
          ? { set: educationLevelIds.map((eid: string) => ({ id: eid })) }
          : undefined,
      },
    });

    await logAudit({
      action: "UPDATE",
      entity: "Program",
      entityId: id,
      before: existing,
      after: program,
    });

    return NextResponse.json(program);
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui program" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
  }

  await db.program.update({
    where: { id },
    data: { isActive: false },
  });

  await logAudit({
    action: "DELETE",
    entity: "Program",
    entityId: id,
    before: existing,
  });

  return NextResponse.json({ success: true });
}
