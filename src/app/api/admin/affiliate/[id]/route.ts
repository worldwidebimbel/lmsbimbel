import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const affiliate = await db.affiliate.findUnique({
    where: { id },
    include: {
      referrals: {
        include: {
          registration: { select: { registrationNo: true, fullName: true, status: true } },
          commissions: true,
        },
        orderBy: { createdAt: "desc" },
      },
      payouts: {
        include: { _count: { select: { commissions: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { referrals: true, payouts: true } },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Afiliator tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(affiliate);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, whatsapp, email, category, bankName, bankAccount, bankHolder, isActive } = body;

  const before = await db.affiliate.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Afiliator tidak ditemukan" }, { status: 404 });
  }

  const affiliate = await db.affiliate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(email !== undefined && { email: email || null }),
      ...(category !== undefined && { category }),
      ...(bankName !== undefined && { bankName: bankName || null }),
      ...(bankAccount !== undefined && { bankAccount: bankAccount || null }),
      ...(bankHolder !== undefined && { bankHolder: bankHolder || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "Affiliate",
    entityId: id,
    before,
    after: affiliate,
  });

  return NextResponse.json(affiliate);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Soft delete: deactivate instead of deleting
  const affiliate = await db.affiliate.update({
    where: { id },
    data: { isActive: false },
  });

  await logAudit({
    action: "DEACTIVATE",
    entity: "Affiliate",
    entityId: id,
    after: { isActive: false },
  });

  return NextResponse.json({ success: true, affiliate });
}
