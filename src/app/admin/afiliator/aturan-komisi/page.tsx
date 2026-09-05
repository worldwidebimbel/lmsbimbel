import { db } from "@/lib/db";
import { CommissionRulesManager } from "@/components/admin/CommissionRulesManager";
import { AfiliatorNav } from "@/components/admin/AfiliatorNav";

export const metadata = { title: "Aturan Komisi" };

export default async function AdminCommissionRulesPage() {
  const [rules, programs] = await Promise.all([
    db.commissionRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: { program: { select: { id: true, name: true } } },
    }),
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aturan Komisi</h1>
      <AfiliatorNav active="aturan" />
      <CommissionRulesManager
        rules={rules.map((r) => ({
          id: r.id,
          type: r.type,
          programId: r.programId,
          programName: r.program?.name || null,
          nominal: r.nominal,
          percentage: r.percentage,
          stage: r.stage,
          priority: r.priority,
          isActive: r.isActive,
        }))}
        programs={programs}
      />
    </div>
  );
}
