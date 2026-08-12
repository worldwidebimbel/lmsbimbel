import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GraduationCap, Plus, BookOpen, Wallet, Layers } from "lucide-react";
import { ProgramsManager } from "@/components/admin/ProgramsManager";

export const metadata = { title: "Program & Jenjang" };

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [programs, educationLevels, branches] = await Promise.all([
    db.program.findMany({
      include: {
        branches: { select: { id: true, name: true, code: true } },
        educationLevels: { select: { id: true, name: true, code: true, order: true, isActive: true } },
        levels: { orderBy: { order: "asc" } },
        _count: { select: { classes: true, invoices: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.educationLevel.findMany({
      orderBy: { order: "asc" },
    }),
    db.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program & Jenjang</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola program bimbel, jenjang pendidikan, dan level
          </p>
        </div>
      </div>

      <ProgramsManager
        initialPrograms={programs.map((p) => ({
          ...p,
          promoUntil: p.promoUntil ? p.promoUntil.toISOString() : null,
        }))}
        educationLevels={educationLevels}
        branches={branches}
      />
    </div>
  );
}
