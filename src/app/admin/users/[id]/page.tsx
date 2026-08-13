import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect, notFound } from "next/navigation";
import EditUserClient from "@/components/admin/EditUserClient";
import { ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Edit Pengguna" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { id } = await params;
  const { isSuperAdmin, allBranches, branchId } = await getBranchScope();
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true, avatar: true, defaultBranchId: true, createdAt: true },
  });
  if (!user) notFound();
  if (!isSuperAdmin && user.defaultBranchId !== branchId) redirect("/admin/users");

  const branches = await db.branch.findMany({
    where: isSuperAdmin ? { isActive: true } : { id: branchId ?? undefined, isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <UserCog className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Pengguna</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <EditUserClient
        user={JSON.parse(JSON.stringify(user))}
        isSelf={session.user.id === id}
        branches={branches.length ? branches : allBranches}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
