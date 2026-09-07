import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, ArrowLeft } from "lucide-react";
import { ensureDefaultRubric } from "@/lib/raport-rubric";
import RubrikAdminClient from "@/components/admin/RubrikAdminClient";

export const metadata = { title: "Rubrik Penilaian Rapor - Admin" };

export default async function AdminRubrikPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    redirect("/admin");
  }

  await ensureDefaultRubric();

  const [levels, aspects] = await Promise.all([
    db.rubricLevel.findMany({ orderBy: [{ type: "asc" }, { stars: "desc" }] }),
    db.attitudeAspect.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold text-gray-900">Rubrik Penilaian Rapor</h1>
          <p className="text-sm text-gray-500">
            Atur rentang nilai, kategori, dan penjelasan tiap level bintang serta aspek sikap belajar
          </p>
        </div>
        <Link
          href="/admin/raport"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Rapor
        </Link>
      </div>

      <RubrikAdminClient
        initialLevels={JSON.parse(JSON.stringify(levels))}
        initialAspects={JSON.parse(JSON.stringify(aspects))}
      />
    </div>
  );
}
