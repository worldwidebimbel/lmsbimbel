import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
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
  const { name, description, isRequired, maxSizeMb, allowedTypes, order, isActive } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description || null;
  if (isRequired !== undefined) updateData.isRequired = Boolean(isRequired);
  if (maxSizeMb !== undefined) updateData.maxSizeMb = Number(maxSizeMb);
  if (Array.isArray(allowedTypes) && allowedTypes.length > 0) updateData.allowedTypes = allowedTypes;
  if (order !== undefined) updateData.order = Number(order);
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada field untuk diupdate" }, { status: 400 });
  }

  const updated = await db.documentType.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    entity: "DocumentType",
    entityId: id,
    action: "UPDATE",
    after: updateData,
  });

  return NextResponse.json(updated);
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

  const inUse = await db.registrationDocument.count({
    where: { documentTypeId: id },
  });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `Jenis dokumen ini dipakai oleh ${inUse} pendaftaran dan tidak bisa dihapus. Nonaktifkan saja agar tidak muncul di form pendaftaran.`,
      },
      { status: 409 }
    );
  }

  await db.documentType.delete({ where: { id } });

  await logAudit({
    entity: "DocumentType",
    entityId: id,
    action: "DELETE",
  });

  return NextResponse.json({ success: true });
}
