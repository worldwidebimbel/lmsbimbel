import { db } from "@/lib/db";
import { AffiliateReferrals } from "@/components/admin/AffiliateReferrals";

export const metadata = { title: "Referral Afiliator" };

export default async function AdminReferralPage() {
  const referrals = await db.referral.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: { select: { id: true, code: true, name: true } },
      registration: { select: { registrationNo: true, fullName: true, status: true } },
      program: { select: { id: true, name: true } },
      commissions: { select: { amount: true, status: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Referral Afiliator</h1>
      <AffiliateReferrals
        referrals={referrals.map((r) => ({
          id: r.id,
          status: r.status,
          fraudFlag: r.fraudFlag,
          fraudReason: r.fraudReason,
          createdAt: r.createdAt.toISOString(),
          affiliate: { code: r.affiliate.code, name: r.affiliate.name },
          registration: r.registration ? {
            registrationNo: r.registration.registrationNo,
            fullName: r.registration.fullName,
            status: r.registration.status,
          } : null,
          program: r.program ? { name: r.program.name } : null,
          commissionAmount: r.commissions.reduce((s, c) => s + c.amount, 0),
        }))}
      />
    </div>
  );
}
