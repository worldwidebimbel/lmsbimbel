import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutTemplate } from "lucide-react";
import LandingPageBuilder from "@/components/admin/LandingPageBuilder";

export const metadata = { title: "Buat Landing Page" };

export default async function NewLandingPagePage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/landing-pages" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <LayoutTemplate className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Landing Page</h1>
          <p className="text-sm text-gray-500">Rancang halaman landing publik</p>
        </div>
      </div>

      <LandingPageBuilder mode="create" />
    </div>
  );
}
