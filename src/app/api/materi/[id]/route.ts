import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

async function checkMaterialBranch(materialId: string) {
  const { isSuperAdmin, branchId } = await getBranchScope();
  const material = await db.material.findUnique({
    where: { id: materialId },
    include: { class: { select: { branchId: true } } },
  });
  if (!material) return { material: null, allowed: false };
  if (!isSuperAdmin && branchId && material.class && material.class.branchId !== branchId) {
    return { material, allowed: false };
  }
  return { material, allowed: true };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { material, allowed } = await checkMaterialBranch(id);
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const full = await db.material.findUnique({
    where: { id },
    include: {
      subject: true,
      class: { include: { teacher: { select: { name: true } } } },
      uploader: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(full);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { material, allowed } = await checkMaterialBranch(id);
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = material.uploaderId === session.user.id ||
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!isOwnerOrAdmin || !allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await db.material.update({
    where: { id },
    data: body,
    include: {
      subject: { select: { name: true, color: true } },
      class: { select: { name: true } },
      _count: { select: { progress: true } },
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
  const { material, allowed } = await checkMaterialBranch(id);
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrAdmin = material.uploaderId === session.user.id ||
    ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!isOwnerOrAdmin || !allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.material.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
