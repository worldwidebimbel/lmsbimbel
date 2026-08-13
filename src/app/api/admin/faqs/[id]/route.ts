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
  const { question, answer, category, order, isActive } = body;

  const faq = await db.siteFaq.update({
    where: { id },
    data: {
      ...(question !== undefined && { question }),
      ...(answer !== undefined && { answer }),
      ...(category !== undefined && { category }),
      ...(order !== undefined && { order: Number(order) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });

  return NextResponse.json(faq);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.siteFaq.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
