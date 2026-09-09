import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import CustomPageBuilder from "@/components/admin/CustomPageBuilder";

export const metadata = { title: "Buat Custom Page" };
export const dynamic = "force-dynamic";

export default async function NewCustomPagePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/custom-pages" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Custom Page</h1>
          <p className="text-sm text-gray-500">Halaman institusional dengan rich text editor</p>
        </div>
      </div>

      <CustomPageBuilder mode="create" />
    </div>
  );
}
