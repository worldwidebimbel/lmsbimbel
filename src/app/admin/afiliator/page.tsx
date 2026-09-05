import { db } from "@/lib/db";
import { AffiliateManager } from "@/components/admin/AffiliateManager";
import { AfiliatorNav } from "@/components/admin/AfiliatorNav";

export const metadata = { title: "Kelola Afiliator" };

export default async function AdminAfiliatorPage() {
  const [affiliates, programs, affiliateUsers] = await Promise.all([
    db.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { referrals: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: "AFILIATOR", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Afiliator</h1>
      <AfiliatorNav active="kelola" />
      <AffiliateManager
        affiliates={affiliates.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          whatsapp: a.whatsapp,
          email: a.email,
          category: a.category,
          isActive: a.isActive,
          clickCount: a.clickCount,
          referralCount: a._count.referrals,
          userId: a.userId,
          userName: a.user?.name ?? null,
          userEmail: a.user?.email ?? null,
          createdAt: a.createdAt.toISOString(),
        }))}
        programs={programs}
        affiliateUsers={affiliateUsers}
      />
    </div>
  );
}
