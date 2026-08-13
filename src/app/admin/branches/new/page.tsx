import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { redirect } from "next/navigation";
import NewBranchClient from "@/components/admin/NewBranchClient";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Tambah Cabang" };

export default async function NewBranchPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/branches" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Cabang</h1>
          <p className="text-sm text-gray-500">Buat cabang baru untuk bimbel</p>
        </div>
      </div>
      <NewBranchClient />
    </div>
  );
}
