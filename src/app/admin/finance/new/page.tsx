import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { redirect } from "next/navigation";
import NewInvoiceClient from "@/components/admin/NewInvoiceClient";
import { Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Buat Tagihan" };

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { isSuperAdmin, allBranches, branchId } = await getBranchScope();
  const branchFilter = session.user.role === "SUPER_ADMIN" ? {} : { defaultBranchId: branchId };

  const [students, plans] = await Promise.all([
    db.user.findMany({ where: { role: "SISWA", isActive: true, ...branchFilter }, select: { id: true, name: true, email: true, defaultBranchId: true }, orderBy: { name: "asc" } }),
    db.billingPlan.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/finance" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
          <Wallet className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Tagihan</h1>
          <p className="text-sm text-gray-500">Tagihan manual untuk siswa</p>
        </div>
      </div>

      <NewInvoiceClient students={students} plans={JSON.parse(JSON.stringify(plans))} branches={allBranches} defaultBranchId={branchId} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
