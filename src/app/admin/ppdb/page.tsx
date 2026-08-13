import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PpdbManager } from "@/components/admin/PpdbManager";
import { STATUS_LABELS } from "@/lib/ppdb-status";

export const metadata = { title: "PPDB — Penerimaan Siswa" };

export default async function PpdbPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const [programs, branches] = await Promise.all([
    db.program.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.branch.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusCounts = await db.registration.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusCountMap = statusCounts.reduce(
    (acc: Record<string, number>, s: { status: string; _count: number }) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PPDB — Penerimaan Siswa</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola pendaftaran calon siswa baru
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = statusCountMap[status] || 0;
          if (count === 0) return null;
          return (
            <span
              key={status}
              className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full"
            >
              {label}: <span className="font-bold text-gray-900">{count}</span>
            </span>
          );
        })}
      </div>

      <PpdbManager programs={programs} branches={branches} />
    </div>
  );
}
