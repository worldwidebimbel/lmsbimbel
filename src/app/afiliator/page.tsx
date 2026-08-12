import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AffiliateDashboard } from "@/components/afiliator/AffiliateDashboard";

export const metadata = { title: "Dashboard Afiliator" };

export default async function AfiliatorDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return <div className="p-8 text-center text-gray-600">Silakan login terlebih dahulu.</div>;
  }

  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, code: true, name: true, clickCount: true, isActive: true,
      bankName: true, bankAccount: true, bankHolder: true,
    },
  });

  if (!affiliate) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Bukan Afiliator</h2>
        <p className="text-gray-600">Akun Anda tidak terdaftar sebagai afiliator.</p>
      </div>
    );
  }

  const [referrals, commissions, payouts] = await Promise.all([
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

  const totalCommission = commissions.reduce((s, c) => s + c.amount, 0);
  const pendingCommission = commissions
    .filter((c) => ["PENDING", "REGISTRATION_VERIFIED", "PAYMENT_VERIFIED"].includes(c.status))
    .reduce((s, c) => s + c.amount, 0);
  const readyPayout = commissions.filter((c) => c.status === "READY_PAYOUT").reduce((s, c) => s + c.amount, 0);
  const paidCommission = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0);

  const stats = {
    clickCount: affiliate.clickCount,
    prospectiveStudents: referrals.filter((r) => r.registration?.status && ["SUBMITTED", "WAITING_VERIFICATION", "VERIFIED"].includes(r.registration.status)).length,
    registeredStudents: referrals.filter((r) => r.registration?.status && ["WAITING_PAYMENT", "PAYMENT_VERIFIED", "ACCEPTED", "CLASS_PLACEMENT"].includes(r.registration.status)).length,
    successfulStudents: referrals.filter((r) => r.registration?.status === "ACTIVE_STUDENT").length,
    totalCommission, pendingCommission, readyPayout, paidCommission,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Afiliator</h1>
        <p className="text-gray-600 text-sm mt-1">Pantau referral dan komisi Anda</p>
      </div>
      <AffiliateDashboard
        affiliate={affiliate}
        stats={stats}
        referrals={referrals.map((r) => ({
          id: r.id,
          status: r.status,
          fraudFlag: r.fraudFlag,
          createdAt: r.createdAt.toISOString(),
          registration: r.registration ? {
            registrationNo: r.registration.registrationNo,
            fullName: r.registration.fullName,
            status: r.registration.status,
          } : null,
          program: r.program ? { name: r.program.name } : null,
        }))}
        payouts={payouts.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          requestedAt: p.requestedAt.toISOString(),
          paidAt: p.paidAt?.toISOString() || null,
          proofUrl: p.proofUrl,
        }))}
      />
    </div>
  );
}
