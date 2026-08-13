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
  const { name, role, bio, photoUrl, email, phone, linkedin, order, isActive } = body;

  const member = await db.siteTeamMember.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(bio !== undefined && { bio }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(linkedin !== undefined && { linkedin }),
      ...(order !== undefined && { order: Number(order) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });

  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.siteTeamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
