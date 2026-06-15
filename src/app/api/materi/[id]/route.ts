import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const material = await db.material.findUnique({
    where: { id },
    include: {
      subject: true,
      class: { include: { teacher: { select: { name: true } } } },
      uploader: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(material);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.material.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = existing.uploaderId === session.user.id ||
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!isOwnerOrAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await db.material.update({
    where: { id },
    data: body,
    include: {
      subject: { select: { name: true, color: true } },
      class: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.material.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = existing.uploaderId === session.user.id ||
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!isOwnerOrAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.material.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
