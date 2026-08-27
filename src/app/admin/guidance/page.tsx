import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HelpCircle, BookOpen, Video, ArrowRight } from "lucide-react";

export const metadata = { title: "Guidance" };

const ADMIN_GUIDES = [
  {
    title: "Build Kelas Online",
    description: "Panduan lengkap membuat dan mengelola kelas online — dari setup kelas, jadwal live, materi, tugas, ujian, hingga mekanisme pendaftaran publik via landing page.",
    href: "/admin/guidance/build-kelas-online",
    icon: "Video",
  },
];

const GURU_GUIDES = [
  {
    title: "Build Kelas Online",
    description: "Panduan untuk guru: cara jadwalkan sesi live, upload materi, buat tugas & ujian online, dan kelola kelas online.",
    href: "/admin/guidance/build-kelas-online",
    icon: "Video",
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Video,
  BookOpen,
};

export default async function GuidancePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guidance</h1>
          <p className="text-sm text-gray-500">Panduan penggunaan sistem LMS Bimbel</p>
        </div>
      </div>

      {/* Panduan Admin */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">Panduan Admin</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADMIN_GUIDES.map((guide) => {
            const Icon = ICON_MAP[guide.icon] ?? BookOpen;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-3">{guide.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                      Baca panduan <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Panduan Guru */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1 rounded-full bg-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Panduan Guru</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GURU_GUIDES.map((guide) => {
            const Icon = ICON_MAP[guide.icon] ?? BookOpen;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <Icon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-3">{guide.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                      Baca panduan <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          Panduan lainnya akan ditambahkan seiring pengembangan sistem.
        </p>
      </div>
    </div>
  );
}
