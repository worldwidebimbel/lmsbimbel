import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const menus = await db.siteMenu.findMany({ orderBy: { order: "asc" } });
  type MenuNode = { id: string; label: string; href: string | null; parentId: string | null; order: number; openInNewTab: boolean; isActive: boolean; children: MenuNode[] };
  const map = new Map<string, MenuNode>(menus.map((m) => [m.id, { ...m, children: [] }]));
  const roots: MenuNode[] = [];
  for (const m of menus) {
    if (m.parentId) {
      const parent = map.get(m.parentId);
      if (parent) parent.children.push(map.get(m.id)!);
    } else {
      roots.push(map.get(m.id)!);
    }
  }
  return NextResponse.json(roots);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { label, href, parentId, order, openInNewTab, isActive } = body;
  if (!label) {
    return NextResponse.json({ error: "label wajib diisi" }, { status: 400 });
  }
  const item = await db.siteMenu.create({
    data: { label, href, parentId, order: order ?? 0, openInNewTab: openInNewTab ?? false, isActive: isActive ?? true },
  });
  return NextResponse.json(item, { status: 201 });
}
