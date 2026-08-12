import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find affiliate by userId
  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    select: { id: true, code: true, name: true, clickCount: true, isActive: true },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Akun afiliator tidak ditemukan" }, { status: 404 });
  }

  const [
    referrals,
    commissions,
    payouts,
  ] = await Promise.all([
    db.referral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        registration: { select: { registrationNo: true, fullName: true, status: true } },
        program: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.commission.findMany({
      where: { referral: { affiliateId: affiliate.id } },
      select: { amount: true, status: true },
    }),
    db.commissionPayout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommission = commissions
    .filter((c) => ["PENDING", "REGISTRATION_VERIFIED", "PAYMENT_VERIFIED"].includes(c.status))
    .reduce((sum, c) => sum + c.amount, 0);
  const readyPayout = commissions
    .filter((c) => c.status === "READY_PAYOUT")
    .reduce((sum, c) => sum + c.amount, 0);
  const paidCommission = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0);

  const prospectiveStudents = referrals.filter(
    (r) => r.registration?.status && ["SUBMITTED", "WAITING_VERIFICATION", "VERIFIED"].includes(r.registration.status)
  ).length;
  const registeredStudents = referrals.filter(
    (r) => r.registration?.status && ["WAITING_PAYMENT", "PAYMENT_VERIFIED", "ACCEPTED", "CLASS_PLACEMENT"].includes(r.registration.status)
  ).length;
  const successfulStudents = referrals.filter(
    (r) => r.registration?.status === "ACTIVE_STUDENT"
  ).length;

  return NextResponse.json({
    affiliate,
    stats: {
      clickCount: affiliate.clickCount,
      prospectiveStudents,
      registeredStudents,
      successfulStudents,
      totalCommission,
      pendingCommission,
      readyPayout,
      paidCommission,
    },
    referrals,
    payouts,
  });
}
