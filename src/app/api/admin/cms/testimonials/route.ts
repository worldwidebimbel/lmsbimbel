import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteTestimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { name, role, text, avatarUrl, photoUrl, rating, programName, isFeatured, order, isActive } = body;
  if (!name || !text) {
    return NextResponse.json({ error: "name dan text wajib diisi" }, { status: 400 });
  }
  const item = await db.siteTestimonial.create({
    data: {
      name,
      role: role || null,
      text,
      avatarUrl: avatarUrl || null,
      photoUrl: photoUrl || null,
      rating: rating ?? 5,
      programName: programName || null,
      isFeatured: isFeatured ?? false,
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
