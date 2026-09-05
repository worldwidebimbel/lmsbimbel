import { db } from "@/lib/db";
import { AffiliatePayouts } from "@/components/admin/AffiliatePayouts";
import { AfiliatorNav } from "@/components/admin/AfiliatorNav";

export const metadata = { title: "Pencairan Komisi" };

export default async function AdminPayoutPage() {
  const payouts = await db.commissionPayout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliate: { select: { id: true, code: true, name: true, bankName: true, bankAccount: true, bankHolder: true } },
      _count: { select: { commissions: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pencairan Komisi</h1>
      <AfiliatorNav active="pencairan" />
      <AffiliatePayouts
        payouts={payouts.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          requestedAt: p.requestedAt.toISOString(),
          paidAt: p.paidAt?.toISOString() || null,
          proofUrl: p.proofUrl,
          commissionCount: p._count.commissions,
          affiliate: {
            code: p.affiliate.code, name: p.affiliate.name,
            bankName: p.affiliate.bankName, bankAccount: p.affiliate.bankAccount, bankHolder: p.affiliate.bankHolder,
          },
        }))}
      />
    </div>
  );
}
