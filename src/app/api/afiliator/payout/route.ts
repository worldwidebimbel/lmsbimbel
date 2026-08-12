import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isActive: true },
  });

  if (!affiliate || !affiliate.isActive) {
    return NextResponse.json({ error: "Akun afiliator tidak aktif" }, { status: 403 });
  }

  const body = await req.json();
  const { amount } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 });
  }

  // Check available balance
  const readyCommissions = await db.commission.findMany({
    where: {
      referral: { affiliateId: affiliate.id },
      status: "READY_PAYOUT",
      payoutId: null,
    },
    select: { id: true, amount: true },
  });

  const available = readyCommissions.reduce((sum, c) => sum + c.amount, 0);

  if (amount > available) {
    return NextResponse.json(
      { error: `Nominal melebihi komisi tersedia (Rp ${available.toLocaleString("id-ID")})` },
      { status: 400 }
    );
  }

  // Create payout and link commissions
  const payout = await db.$transaction(async (tx) => {
    const newPayout = await tx.commissionPayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        status: "REQUESTED",
        requestedAt: new Date(),
      },
    });

    // Link commissions to this payout (greedy: link until amount is covered)
    let remaining = amount;
    for (const c of readyCommissions) {
      if (remaining <= 0) break;
      await tx.commission.update({
        where: { id: c.id },
        data: { payoutId: newPayout.id },
      });
      remaining -= c.amount;
    }

    return newPayout;
  });

  await logAudit({
    action: "REQUEST_PAYOUT",
    entity: "CommissionPayout",
    entityId: payout.id,
    after: { amount, affiliateId: affiliate.id },
  });

  return NextResponse.json(payout, { status: 201 });
}
