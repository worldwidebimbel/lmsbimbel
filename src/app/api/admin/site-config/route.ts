import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await db.siteConfig.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.siteConfig.findUnique({ where: { key } });
    if (existing) {
      await db.siteConfig.update({ where: { key }, data: { value: String(value) } });
    } else {
      await db.siteConfig.create({ data: { key, value: String(value) } });
    }
  }
  await logAudit({
    entity: "SiteConfig",
    entityId: "bulk",
    action: "UPDATE",
    after: { keys: Object.keys(body) },
  });
  return NextResponse.json({ ok: true });
}
