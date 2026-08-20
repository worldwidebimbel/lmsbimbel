import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.siteSocialLink.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { platform, url, icon, order, isActive } = body;
  if (!platform || !url) {
    return NextResponse.json({ error: "platform dan url wajib diisi" }, { status: 400 });
  }
  const item = await db.siteSocialLink.create({
    data: { platform, url, icon, order: order ?? 0, isActive: isActive ?? true },
  });
  return NextResponse.json(item, { status: 201 });
}
