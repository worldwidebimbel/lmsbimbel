import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, ArrowLeft } from "lucide-react";
import CustomPageListClient from "@/components/admin/CustomPageListClient";

export const metadata = { title: "Custom Pages" };
export const dynamic = "force-dynamic";

export default async function CustomPagesAdminPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const pages = await db.customPage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, isPublished: true, publishedAt: true, createdAt: true,
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileText className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Custom Pages</h1>
          <p className="text-sm text-gray-500">Halaman institusional (Terms, Privacy, Karir, dst.) — rich text + header/footer website</p>
        </div>
      </div>

      <Link
        href="/admin/custom-pages/new"
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
      >
        <Plus className="h-4 w-4" /> Buat Custom Page
      </Link>

      <CustomPageListClient pages={JSON.parse(JSON.stringify(pages))} />
    </div>
  );
}
