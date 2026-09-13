import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const page = await db.customPage.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { slug, title, sections, showTitle, showHeader, showFooter, metaTitle, metaDesc, isPublished } = body;

  if (slug) {
    const existing = await db.customPage.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }
  }

  const page = await db.customPage.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(sections !== undefined && { sections }),
      ...(showTitle !== undefined && { showTitle: Boolean(showTitle) }),
      ...(showHeader !== undefined && { showHeader: Boolean(showHeader) }),
      ...(showFooter !== undefined && { showFooter: Boolean(showFooter) }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDesc !== undefined && { metaDesc }),
      ...(isPublished !== undefined && {
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null,
      }),
    },
  });

  await logAudit({
    entity: "CustomPage",
    entityId: id,
    action: "UPDATE",
    after: { slug, title, isPublished },
  });

  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.customPage.delete({ where: { id } });
  await logAudit({
    entity: "CustomPage",
    entityId: id,
    action: "DELETE",
  });
  return NextResponse.json({ success: true });
}
