import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, avatar: true, defaultBranchId: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const { id } = await params;
  const body = await req.json();
  const { name, email, password, role, isActive, branchId: bodyBranchId } = body;

  const targetUser = await db.user.findUnique({ where: { id }, select: { id: true, defaultBranchId: true } });
  if (!targetUser) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && targetUser.defaultBranchId !== branchId) {
    return NextResponse.json({ error: "Tidak bisa mengedit user di cabang lain" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (role) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;
  if (password) data.password = await bcrypt.hash(password, 12);
  if (isSuperAdmin && bodyBranchId) data.defaultBranchId = bodyBranchId;

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, defaultBranchId: true, createdAt: true },
  });

  await logAudit({
    entity: "User",
    entityId: id,
    action: "UPDATE",
    after: data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  await db.user.update({ where: { id }, data: { isActive: false } });

  await logAudit({
    entity: "User",
    entityId: id,
    action: "DEACTIVATE",
    before: { isActive: true },
    after: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
