import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import JurnalAdminClient from "@/components/admin/JurnalAdminClient";

export const metadata = { title: "Jurnal Mengajar - Admin" };

export default async function AdminJurnalPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { branchId, isSuperAdmin } = await getBranchScope();

  const where = isSuperAdmin ? {} : branchId ? { branchId } : {};
  const classWhere = isSuperAdmin ? {} : branchId ? { branchId } : {};

  const [journals, classes, teachers] = await Promise.all([
    db.teachingJournal.findMany({
      where,
      include: {
        class: { select: { id: true, name: true, subject: { select: { name: true } } } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { sessionDate: "desc" },
      take: 200,
    }),
    db.class.findMany({
      where: classWhere as Record<string, unknown>,
      select: { id: true, name: true, subject: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: "GURU", isActive: true, ...(isSuperAdmin ? {} : branchId ? { branchId } : {}) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <NotebookPen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Mengajar</h1>
          <p className="text-sm text-gray-500">Monitor jurnal mengajar semua tutor</p>
        </div>
      </div>

      <JurnalAdminClient
        initialJournals={JSON.parse(JSON.stringify(journals))}
        classes={JSON.parse(JSON.stringify(classes))}
        teachers={JSON.parse(JSON.stringify(teachers))}
      />
    </div>
  );
}
