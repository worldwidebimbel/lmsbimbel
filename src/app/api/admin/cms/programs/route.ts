import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteProgram.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { title, slug, subtitle, description, icon, color, imageUrl, features, levelLabel, theme, imagePosition, linkUrl, order, isActive } = body;
  if (!title) {
    return NextResponse.json({ error: "title wajib diisi" }, { status: 400 });
  }
  const item = await db.siteProgram.create({
    data: {
      title,
      slug: slug || undefined,
      subtitle: subtitle || null,
      description: description || null,
      icon: icon || "GraduationCap",
      color: color || "bg-blue-100 text-blue-700",
      imageUrl: imageUrl || null,
      features: features ?? null,
      levelLabel: levelLabel || null,
      theme: theme || "blue",
      imagePosition: imagePosition || "left",
      linkUrl: linkUrl || null,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
