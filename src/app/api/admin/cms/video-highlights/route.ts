import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteVideoHighlight.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, description, icon, theme, order, isActive } = body;
  if (!title) {
    return NextResponse.json({ error: "title wajib diisi" }, { status: 400 });
  }
  const item = await db.siteVideoHighlight.create({
    data: { title, description, icon, theme: theme ?? "blue", order: order ?? 0, isActive: isActive ?? true },
  });
  await logAudit({ entity: "SiteVideoHighlight", entityId: item.id, action: "CREATE", after: { title } });
  return NextResponse.json(item, { status: 201 });
}
