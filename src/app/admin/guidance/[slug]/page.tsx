import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Wallet, UserPlus, Banknote, Share2, MonitorSmartphone, Award, FileBadge, Video, CalendarDays, Server, KeyRound, HelpCircle } from "lucide-react";
import GuideMarkdown from "@/components/guidance/GuideMarkdown";
import { getGuidanceGuide, getGuidanceGuidesForRole } from "@/lib/guidance";

export const dynamic = "force-dynamic";

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuidanceGuide(slug);
  return { title: guide ? `${guide.title} — Guidance` : "Guidance" };
}

export default async function GuidanceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) redirect("/admin");

  const { slug } = await params;
  const guide = getGuidanceGuide(slug);
  if (!guide) notFound();
  if (guide.superAdminOnly && session.user.role !== "SUPER_ADMIN") notFound();

  let content: string;
  try {
    content = await readFile(path.join(process.cwd(), "doc", guide.file), "utf-8");
  } catch {
    notFound();
  }

  const Icon = ICON_MAP[guide.icon] ?? BookOpen;
  const visibleGuides = getGuidanceGuidesForRole(session.user.role);
  const idx = visibleGuides.findIndex((g) => g.slug === slug);
  const prev = idx > 0 ? visibleGuides[idx - 1] : null;
  const next = idx >= 0 && idx < visibleGuides.length - 1 ? visibleGuides[idx + 1] : null;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/guidance" className="rounded-lg p-2 hover:bg-gray-100" aria-label="Kembali ke Guidance">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{guide.title}</h1>
          <p className="text-sm text-gray-500">{guide.description}</p>
        </div>
      </div>

      <GuideMarkdown content={content} />

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-sm text-gray-500">
          Dokumen sumber: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">doc/{guide.file}</code> — perubahan pada file tersebut otomatis tampil di halaman ini.
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4">
        {prev ? (
          <Link href={`/admin/guidance/${prev.slug}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" /> {prev.title}
          </Link>
        ) : (
          <Link href="/admin/guidance" className="text-sm text-gray-500 hover:text-gray-700">
            ← Kembali ke Guidance
          </Link>
        )}
        {next && (
          <Link href={`/admin/guidance/${next.slug}`} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
            {next.title} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
