import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyAfiliatorPayout } from "@/lib/afiliator-notifications";

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

  const [payouts, total] = await Promise.all([
    db.commissionPayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        affiliate: { select: { id: true, code: true, name: true, bankName: true, bankAccount: true, bankHolder: true } },
        _count: { select: { commissions: true } },
      },
    }),
    db.commissionPayout.count({ where }),
  ]);

  return NextResponse.json({
    data: payouts,
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
  const { payoutId, action, proofUrl, rejectionReason } = body;

  if (!payoutId || !action) {
    return NextResponse.json({ error: "payoutId dan action wajib diisi" }, { status: 400 });
  }

  const payout = await db.commissionPayout.findUnique({
    where: { id: payoutId },
    include: { commissions: true },
  });

  if (!payout) {
    return NextResponse.json({ error: "Pencairan tidak ditemukan" }, { status: 404 });
  }

  if (action === "approve") {
    await db.$transaction([
      db.commissionPayout.update({
        where: { id: payoutId },
        data: { status: "APPROVED", verifiedBy: session.user.id },
      }),
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "READY_PAYOUT" },
      }),
    ]);
  } else if (action === "pay") {
    await db.$transaction([
      db.commissionPayout.update({
        where: { id: payoutId },
        data: { status: "PAID", paidAt: new Date(), proofUrl: proofUrl || null },
      }),
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "PAID" },
      }),
    ]);
  } else if (action === "reject") {
    await db.$transaction([
      db.commissionPayout.update({
        where: { id: payoutId },
        data: { status: "REJECTED" },
      }),
      db.commission.updateMany({
        where: { payoutId },
        data: { status: "VALID", payoutId: null },
      }),
    ]);
  } else {
    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  }

  await logAudit({
    action: `PAYOUT_${action.toUpperCase()}`,
    entity: "CommissionPayout",
    entityId: payoutId,
    after: { action, proofUrl, rejectionReason },
  });

  // Notify afiliator of payout status change
  const statusMap: Record<string, string> = {
    approve: "APPROVED",
    pay: "PAID",
    reject: "REJECTED",
  };
  await notifyAfiliatorPayout({
    affiliateId: payout.affiliateId,
    amount: payout.amount,
    status: statusMap[action] || action.toUpperCase(),
  });

  return NextResponse.json({ success: true });
}
