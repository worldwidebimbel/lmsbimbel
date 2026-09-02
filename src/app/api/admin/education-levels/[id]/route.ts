import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

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
  const { name, code, order, isActive } = body;

  try {
    const level = await db.educationLevel.update({
      where: { id },
      data: {
        name,
        code: code?.toUpperCase(),
        order,
        isActive,
      },
    });
    await logAudit({
      entity: "EducationLevel",
      entityId: id,
      action: "UPDATE",
      after: { name, isActive },
    });
    return NextResponse.json(level);
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui jenjang" }, { status: 400 });
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
    await db.educationLevel.update({
      where: { id },
      data: { isActive: false },
    });
    await logAudit({
      entity: "EducationLevel",
      entityId: id,
      action: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus jenjang" }, { status: 400 });
  }
}
