import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { code, name, address, phone, email, managerName, isActive, isDefault } = body;

  if (isDefault) {
    await db.branch.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const branch = await db.branch.update({
    where: { id },
    data: {
      code: code?.toUpperCase(),
      name,
      address,
      phone,
      email,
      managerName,
      isActive,
      isDefault,
    },
  });

  return NextResponse.json(branch);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const related = await db.branch.findUnique({
    where: { id },
    include: { _count: { select: { users: true, classes: true, invoices: true } } },
  });

  if (!related) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (related._count.users > 0 || related._count.classes > 0 || related._count.invoices > 0) {
    return NextResponse.json({ error: "Cabang masih memiliki data terkait" }, { status: 400 });
  }

  await db.branch.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
