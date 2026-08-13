import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import NewBranchTransactionClient from "@/components/admin/NewBranchTransactionClient";

export const metadata = { title: "Catat Transaksi Cabang" };

export default async function NewBranchTransactionPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { isSuperAdmin, allBranches, branchId } = await getBranchScope();
  const branches = await db.branch.findMany({
    where: isSuperAdmin ? { isActive: true } : { id: branchId ?? undefined, isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <NewBranchTransactionClient
      branches={branches.length ? branches : allBranches}
      defaultBranchId={branchId}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
