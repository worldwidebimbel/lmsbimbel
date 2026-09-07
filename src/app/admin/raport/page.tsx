import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Star } from "lucide-react";
import { ensureDefaultRubric } from "@/lib/raport-rubric";
import RaportAdminClient from "@/components/admin/RaportAdminClient";

export const metadata = { title: "Raport - Admin" };

export default async function AdminRaportPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK", "GURU"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { branchId, isSuperAdmin } = await getBranchScope();

  if (["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    await ensureDefaultRubric();
  }

  const classWhere = isSuperAdmin ? {} : branchId ? { branchId } : {};
  const raportWhere = isSuperAdmin ? {} : branchId ? { branchId } : {};

  const [classes, raports, academicYears, rubricLevels, attitudeAspects] = await Promise.all([
    db.class.findMany({
      where: session.user.role === "GURU"
        ? { teacherId: session.user.id, isActive: true }
        : classWhere as Record<string, unknown>,
      select: {
        id: true, name: true,
        subject: { select: { name: true } },
        students: { select: { student: { select: { id: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.raport.findMany({
      where: session.user.role === "GURU"
        ? { class: { teacherId: session.user.id } }
        : raportWhere as Record<string, unknown>,
      include: {
        student: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, subject: { select: { name: true } } } },
        academicYear: { select: { id: true, name: true } },
        attitudes: { select: { id: true, aspectId: true, stars: true, note: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.academicYear.findMany({
      orderBy: { name: "desc" },
      select: { id: true, name: true },
    }),
    db.rubricLevel.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { stars: "desc" }],
    }),
    db.attitudeAspect.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold text-gray-900">Raport Siswa</h1>
          <p className="text-sm text-gray-500">Generate, nilai sikap, edit, dan publikasi raport siswa</p>
        </div>
        {["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role) && (
          <Link
            href="/admin/raport/rubrik"
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Star className="h-4 w-4" /> Atur Rubrik
          </Link>
        )}
      </div>

      <RaportAdminClient
        classes={JSON.parse(JSON.stringify(classes))}
        initialRaports={JSON.parse(JSON.stringify(raports))}
        academicYears={JSON.parse(JSON.stringify(academicYears))}
        rubricLevels={JSON.parse(JSON.stringify(rubricLevels))}
        attitudeAspects={JSON.parse(JSON.stringify(attitudeAspects))}
        isGuru={session.user.role === "GURU"}
      />
    </div>
  );
}
