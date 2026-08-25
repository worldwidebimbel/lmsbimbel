import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [students, payments, branches, overdueInvoices, pendingPpdb, totalAffiliates, activeEvents, piutang] = await Promise.all([
    db.user.findMany({
      where: { role: "SISWA", createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, defaultBranchId: true },
    }),
    db.payment.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, confirmedAt: { not: null } },
      select: { amount: true, createdAt: true },
    }),
    db.branch.findMany({
      select: {
        id: true, name: true,
        _count: { select: { users: { where: { role: "SISWA", isActive: true } } } },
      },
    }),
    db.invoice.aggregate({
      where: { status: "OVERDUE" },
      _sum: { amount: true },
    }),
    db.registration.count({ where: { status: { in: ["SUBMITTED", "WAITING_VERIFICATION"] } } }),
    db.affiliate.count({ where: { isActive: true } }),
    db.event.count({ where: { status: "PUBLISHED" } }),
    db.invoice.aggregate({
      where: { status: "UNPAID" },
      _sum: { amount: true },
    }),
  ]);

  const months: string[] = [];
  const studentGrowth: number[] = [];
  const revenueGrowth: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = monthStart.toLocaleDateString("id-ID", { month: "short" });
    months.push(label);

    const monthStudents = students.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= monthStart && d <= monthEnd;
    }).length;
    studentGrowth.push(monthStudents);

    const monthRevenue = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    revenueGrowth.push(monthRevenue);
  }

  const branchComparison = branches.map((b) => ({
    name: b.name,
    students: b._count.users,
  }));

  return NextResponse.json({
    overview: {
      totalBranches: branches.length,
      pendingPpdb,
      totalAffiliates,
      activeEvents,
      piutang: piutang._sum.amount ?? 0,
      tunggakan: overdueInvoices._sum.amount ?? 0,
    },
    charts: {
      months,
      studentGrowth,
      revenueGrowth,
    },
    branchComparison,
  });
}
