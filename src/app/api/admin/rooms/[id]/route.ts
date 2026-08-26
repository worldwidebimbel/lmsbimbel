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
  const { name, roomNumber, buildingId, capacity, floor, facilities, photoUrl, isActive } = body;

  try {
    const room = await db.room.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomNumber !== undefined && { roomNumber: roomNumber || null }),
        ...(buildingId !== undefined && { buildingId }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(floor !== undefined && { floor: floor || null }),
        ...(facilities !== undefined && { facilities }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(room);
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui ruangan" }, { status: 400 });
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
    await db.room.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus ruangan" }, { status: 400 });
  }
}
