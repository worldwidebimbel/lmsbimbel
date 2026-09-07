import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const MANAGE_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const aspect = await db.attitudeAspect.findUnique({ where: { id } });
  if (!aspect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, description, weight, order, isActive } = body;

  const data: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name?.trim()) return NextResponse.json({ error: "Nama aspek wajib diisi" }, { status: 400 });
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (weight !== undefined) {
    const weightNum = Number(weight);
    if (Number.isNaN(weightNum) || weightNum <= 0) {
      return NextResponse.json({ error: "Bobot harus angka lebih dari 0" }, { status: 400 });
    }
    data.weight = weightNum;
  }
  if (order !== undefined) {
    const orderNum = Number(order);
    if (!Number.isInteger(orderNum)) return NextResponse.json({ error: "Urutan tidak valid" }, { status: 400 });
    data.order = orderNum;
  }
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const updated = await db.attitudeAspect.update({ where: { id }, data });

  await logAudit({
    entity: "AttitudeAspect",
    entityId: id,
    action: "UPDATE",
    before: { name: aspect.name, isActive: aspect.isActive },
    after: data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const aspect = await db.attitudeAspect.findUnique({ where: { id } });
  if (!aspect) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usage = await db.raportAttitude.count({ where: { aspectId: id } });
  if (usage > 0) {
    return NextResponse.json(
      { error: `Aspek sudah dipakai di ${usage} rapor. Nonaktifkan saja agar riwayat rapor tetap utuh.` },
      { status: 409 },
    );
  }

  await db.attitudeAspect.delete({ where: { id } });
  await logAudit({ entity: "AttitudeAspect", entityId: id, action: "DELETE", before: { name: aspect.name } });
  return NextResponse.json({ success: true });
}
