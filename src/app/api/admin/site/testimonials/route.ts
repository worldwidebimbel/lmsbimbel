import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const items = await db.siteTestimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const item = await db.siteTestimonial.create({
    data: {
      name: body.name,
      role: body.role ?? null,
      text: body.text,
      avatarUrl: body.avatarUrl ?? null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  await logAudit({ entity: "SiteTestimonial", entityId: item.id, action: "CREATE", after: { name: body.name } });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  const item = await db.siteTestimonial.update({ where: { id }, data });
  await logAudit({ entity: "SiteTestimonial", entityId: id, action: "UPDATE" });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await db.siteTestimonial.delete({ where: { id } });
  await logAudit({ entity: "SiteTestimonial", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
