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

  const pages = await db.customPage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { slug, title, sections, showTitle, showHeader, showFooter, metaTitle, metaDesc, isPublished } = body;

  if (!slug || !title || !Array.isArray(sections)) {
    return NextResponse.json({ error: "slug, title, dan sections (array) wajib diisi" }, { status: 400 });
  }

  const existing = await db.customPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
  }

  const page = await db.customPage.create({
    data: {
      slug,
      title,
      sections,
      showTitle: Boolean(showTitle ?? true),
      showHeader: Boolean(showHeader ?? true),
      showFooter: Boolean(showFooter ?? true),
      metaTitle: metaTitle ?? null,
      metaDesc: metaDesc ?? null,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
    },
  });

  await logAudit({
    entity: "CustomPage",
    entityId: page.id,
    action: "CREATE",
    after: { slug, title, isPublished: Boolean(isPublished) },
  });

  return NextResponse.json(page, { status: 201 });
}
