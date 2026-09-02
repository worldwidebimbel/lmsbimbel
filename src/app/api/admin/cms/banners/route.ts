import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteBanner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, titleHighlight, subtitle, imageUrl, linkUrl, linkLabel, alignment, overlayOpacity, order, isActive } = body;
  if (!title) {
    return NextResponse.json({ error: "title wajib diisi" }, { status: 400 });
  }
  const item = await db.siteBanner.create({
    data: {
      title,
      titleHighlight: titleHighlight || null,
      subtitle: subtitle || null,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      linkLabel: linkLabel || null,
      alignment: alignment || "left",
      overlayOpacity: overlayOpacity ?? 0.4,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });
  await logAudit({ entity: "SiteBanner", entityId: item.id, action: "CREATE", after: { title } });
  return NextResponse.json(item, { status: 201 });
}
