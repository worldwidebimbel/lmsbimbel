import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const banners = await db.siteBanner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const banner = await db.siteBanner.create({
    data: {
      title: body.title,
      subtitle: body.subtitle ?? null,
      imageUrl: body.imageUrl ?? null,
      linkUrl: body.linkUrl ?? null,
      linkLabel: body.linkLabel ?? null,
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
    },
  });
  await logAudit({ entity: "SiteBanner", entityId: banner.id, action: "CREATE", after: { title: body.title } });
  return NextResponse.json(banner, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  const banner = await db.siteBanner.update({ where: { id }, data });
  await logAudit({ entity: "SiteBanner", entityId: id, action: "UPDATE" });
  return NextResponse.json(banner);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await db.siteBanner.delete({ where: { id } });
  await logAudit({ entity: "SiteBanner", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
