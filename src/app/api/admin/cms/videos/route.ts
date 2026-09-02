import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteVideo.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, videoUrl, thumbnailUrl, duration, category, isFeatured, order, isActive } = body;
  if (!title || !videoUrl) {
    return NextResponse.json({ error: "title dan videoUrl wajib diisi" }, { status: 400 });
  }
  const item = await db.siteVideo.create({
    data: { title, videoUrl, thumbnailUrl, duration, category: category ?? "Umum", isFeatured: isFeatured ?? false, order: order ?? 0, isActive: isActive ?? true },
  });
  await logAudit({ entity: "SiteVideo", entityId: item.id, action: "CREATE", after: { title } });
  return NextResponse.json(item, { status: 201 });
}
