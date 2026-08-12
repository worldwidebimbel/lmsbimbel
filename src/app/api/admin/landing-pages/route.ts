import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pages = await db.landingPage.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { slug, title, description, sections, metaTitle, metaDesc, ogImage, ctaType, ctaUrl, isPublished } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug dan title wajib diisi" }, { status: 400 });
  }

  const existing = await db.landingPage.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 400 });
  }

  const page = await db.landingPage.create({
    data: {
      slug,
      title,
      description: description ?? null,
      sections: sections ?? [],
      metaTitle: metaTitle ?? null,
      metaDesc: metaDesc ?? null,
      ogImage: ogImage ?? null,
      ctaType: ctaType ?? "INQUIRY",
      ctaUrl: ctaUrl ?? null,
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? new Date() : null,
    },
  });

  return NextResponse.json(page, { status: 201 });
}
