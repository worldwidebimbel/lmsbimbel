import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const status = searchParams.get("status") || "";
  const affiliateId = searchParams.get("affiliateId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (affiliateId) where.affiliateId = affiliateId;

  const [referrals, total] = await Promise.all([
    db.referral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        affiliate: { select: { id: true, code: true, name: true } },
        registration: { select: { registrationNo: true, fullName: true, status: true } },
        program: { select: { id: true, name: true } },
        commissions: true,
      },
    }),
    db.referral.count({ where }),
  ]);

  return NextResponse.json({
    data: referrals,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { referralId, reason } = body;

  if (!referralId) {
    return NextResponse.json({ error: "referralId wajib diisi" }, { status: 400 });
  }

  const referral = await db.referral.findUnique({ where: { id: referralId } });
  if (!referral) {
    return NextResponse.json({ error: "Referral tidak ditemukan" }, { status: 404 });
  }

  await db.$transaction([
    db.referral.update({
      where: { id: referralId },
      data: { status: "CANCELLED", fraudReason: reason || "Dibatalkan oleh admin" },
    }),
    db.commission.updateMany({
      where: { referralId },
      data: { status: "CANCELLED", cancelledReason: reason || "Dibatalkan oleh admin" },
    }),
  ]);

  await logAudit({
    action: "CANCEL_REFERRAL",
    entity: "Referral",
    entityId: referralId,
    after: { status: "CANCELLED", reason },
  });

  return NextResponse.json({ success: true });
}
