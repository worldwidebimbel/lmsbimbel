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
  const page = await db.landingPage.findUnique({ where: { id } });
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
  const { slug, title, description, sections, metaTitle, metaDesc, ogImage, ctaType, ctaUrl, isPublished } = body;

  if (slug) {
    const existing = await db.landingPage.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
    }
  }

  const page = await db.landingPage.update({
    where: { id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(sections !== undefined && { sections }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDesc !== undefined && { metaDesc }),
      ...(ogImage !== undefined && { ogImage }),
      ...(ctaType !== undefined && { ctaType }),
      ...(ctaUrl !== undefined && { ctaUrl }),
      ...(isPublished !== undefined && {
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date() : null,
      }),
    },
  });

  await logAudit({
    entity: "LandingPage",
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
  await db.landingPage.delete({ where: { id } });
  await logAudit({
    entity: "LandingPage",
    entityId: id,
    action: "DELETE",
  });
  return NextResponse.json({ success: true });
}
