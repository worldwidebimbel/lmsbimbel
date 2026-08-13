import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus } from "lucide-react";
import TeamManager from "@/components/admin/TeamManager";

export const metadata = { title: "Kelola Tim" };
export const dynamic = "force-dynamic";

export default async function TeamAdminPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const members = await db.siteTeamMember.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Users className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Tim</h1>
          <p className="text-sm text-gray-500">Profil tim & tutor publik</p>
        </div>
      </div>

      <TeamManager members={JSON.parse(JSON.stringify(members))} />
    </div>
  );
}
