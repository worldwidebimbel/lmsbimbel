import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = await req.json();
  const { name, email, password, role, branchId: bodyBranchId } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "name, email, password, role wajib diisi" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });

  const targetBranchId = isSuperAdmin ? (bodyBranchId || branchId) : branchId;
  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { name, email, password: hashed, role, defaultBranchId: targetBranchId },
    select: { id: true, name: true, email: true, role: true, isActive: true, defaultBranchId: true, createdAt: true },
  });

  await logAudit({
    entity: "User",
    entityId: user.id,
    action: "CREATE",
    after: { name, email, role, branchId: targetBranchId },
  });

  return NextResponse.json(user, { status: 201 });
}
