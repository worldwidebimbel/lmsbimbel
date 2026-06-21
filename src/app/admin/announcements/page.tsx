import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBranchScope } from "@/lib/branch-context";
import AnnouncementsClient from "@/components/admin/AnnouncementsClient";
import { Megaphone } from "lucide-react";

export const metadata = { title: "Pengumuman" };

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  const { isSuperAdmin, branchId, allBranches } = await getBranchScope();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
          <Megaphone className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-sm text-gray-500">Kirim pengumuman ke semua pengguna atau per role</p>
        </div>
      </div>

      <AnnouncementsClient
        branches={allBranches}
        isSuperAdmin={isSuperAdmin}
        defaultBranchId={branchId}
      />
    </div>
  );
}
