import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, address, description, photoUrl, isActive } = body;

  try {
    const building = await db.building.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address: address || null }),
        ...(description !== undefined && { description: description || null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(building);
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui gedung" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await db.building.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus gedung" }, { status: 400 });
  }
}
