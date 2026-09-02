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
  const configs = await db.siteConfig.findMany();
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body: Record<string, string> = await req.json();
  const upserts = Object.entries(body).map(([key, value]) =>
    db.siteConfig.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  );
  await db.$transaction(upserts);
  await logAudit({ entity: "SiteConfig", entityId: Object.keys(body).join(","), action: "UPDATE" });
  return NextResponse.json({ success: true });
}
