import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HelpCircle, ArrowRight, BookOpen, GraduationCap, Wallet, UserPlus, Banknote, Share2, MonitorSmartphone, Award, FileBadge, Video, CalendarDays, Server, KeyRound } from "lucide-react";
import { GUIDANCE_CATEGORIES, getGuidanceGuidesForRole } from "@/lib/guidance";

export const metadata = { title: "Guidance" };

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Wallet,
  UserPlus,
  Banknote,
  Share2,
  MonitorSmartphone,
  Award,
  FileBadge,
  Video,
  CalendarDays,
  Server,
  KeyRound,
};

export default async function GuidancePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const guides = getGuidanceGuidesForRole(session.user.role);
  const totalGuides = guides.length;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guidance</h1>
          <p className="text-sm text-gray-500">
            Panduan penggunaan sistem LMS Bimbel — {totalGuides} panduan operasional, build, dan teknis
          </p>
        </div>
      </div>

      {GUIDANCE_CATEGORIES.map((category) => {
        const categoryGuides = guides.filter((g) => g.category === category.key);
        if (categoryGuides.length === 0) return null;

        return (
          <div key={category.key}>
            <div className="mb-4 flex items-center gap-2">
              <div className={`h-6 w-1 rounded-full ${category.accent}`} />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{category.label}</h2>
                <p className="text-xs text-gray-500">{category.description}</p>
              </div>
              <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {categoryGuides.length} panduan
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryGuides.map((guide) => {
                const Icon = ICON_MAP[guide.icon] ?? BookOpen;
                return (
                  <Link
                    key={guide.slug}
                    href={`/admin/guidance/${guide.slug}`}
                    className={`group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-all ${category.hoverBorder}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${category.iconBg}`}>
                        <Icon className={`h-5 w-5 ${category.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {guide.title}
                        </h3>
                        <p className="mt-1 line-clamp-3 text-sm text-gray-500">{guide.description}</p>
                        <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${category.linkColor}`}>
                          Baca panduan <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          Semua panduan dibaca langsung dari folder <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">doc/</code> — tambahkan file
          markdown baru dan daftarkan di <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">src/lib/guidance.ts</code> untuk menambah
          panduan lain.
        </p>
      </div>
    </div>
  );
}
