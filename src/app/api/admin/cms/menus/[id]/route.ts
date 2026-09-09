import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  // Reorder support: { direction: "up" | "down" }
  if (body.direction === "up" || body.direction === "down") {
    const current = await db.siteMenu.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const siblings = await db.siteMenu.findMany({
      where: { parentId: current.parentId, isActive: true },
      orderBy: { order: "asc" },
    });
    const idx = siblings.findIndex((m) => m.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found in siblings" }, { status: 404 });

    const swapIdx = body.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) {
      return NextResponse.json({ ok: true, message: "No movement needed" });
    }

    const target = siblings[swapIdx];
    await db.$transaction([
      db.siteMenu.update({ where: { id }, data: { order: target.order } }),
      db.siteMenu.update({ where: { id: target.id }, data: { order: current.order } }),
    ]);
    await logAudit({ entity: "SiteMenu", entityId: id, action: "UPDATE", after: { direction: body.direction } });
    return NextResponse.json({ ok: true });
  }

  const item = await db.siteMenu.update({ where: { id }, data: body });
  await logAudit({ entity: "SiteMenu", entityId: id, action: "UPDATE" });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await db.siteMenu.delete({ where: { id } });
  await logAudit({ entity: "SiteMenu", entityId: id, action: "DELETE" });
  return NextResponse.json({ ok: true });
}
