import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { getBranchScope } from "@/lib/branch-context";
import {
  Users, BookOpen, CalendarDays, TrendingUp,
  GraduationCap, CheckSquare, Wallet, ArrowUpRight,
  UserCheck, Share2, FileText, Globe, NotebookPen,
} from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";

async function getDashboardStats(branchId: string | null, isSuperAdmin: boolean) {
  const branchFilter = isSuperAdmin ? {} : branchId ? { branchId } : {};
  const userBranchFilter = isSuperAdmin ? {} : branchId ? { defaultBranchId: branchId } : {};

  const [
    totalStudents, totalTeachers, totalClasses, unpaidInvoices, activeFlags,
    pendingPpdb, totalAffiliates, pendingCommissions, activeLandingPages, totalFaqs,
  ] = await Promise.all([
    db.user.count({ where: { role: "SISWA", isActive: true, ...userBranchFilter } }),
    db.user.count({ where: { role: "GURU", isActive: true, ...userBranchFilter } }),
    db.class.count({ where: { isActive: true, ...branchFilter } }),
    db.invoice.aggregate({ where: { status: "UNPAID", ...branchFilter }, _sum: { amount: true } }),
    db.featureFlag.count({ where: { isActive: true } }),
    db.registration.count({ where: { status: { in: ["SUBMITTED", "WAITING_VERIFICATION"] }, ...branchFilter } }),
    db.affiliate.count({ where: { isActive: true } }),
    db.commission.count({ where: { status: "PENDING" } }),
    db.landingPage.count({ where: { isPublished: true } }),
    db.siteFaq.count({ where: { isActive: true } }),
  ]);

  return {
    totalStudents, totalTeachers, totalClasses,
    unpaidAmount: unpaidInvoices._sum.amount ?? 0,
    activeFlags,
    pendingPpdb, totalAffiliates, pendingCommissions,
    activeLandingPages, totalFaqs,
  };
}

export default async function AdminDashboard() {
  const session = await auth();
  const { branchId, isSuperAdmin } = await getBranchScope();
  const role = session?.user?.role ?? "ADMIN";
  const stats = await getDashboardStats(branchId, isSuperAdmin);

  const isFinance = role === "ADMIN_KEUANGAN";
  const isAcademic = role === "ADMIN_AKADEMIK";
  const isCabang = role === "ADMIN_CABANG";

  let recentJournals: Array<{ id: string; activity: string; sessionDate: Date; status: string; teacher: { name: string }; class: { name: string } }> = [];
  if (isAcademic) {
    const journalWhere = isSuperAdmin ? {} : branchId ? { branchId } : {};
    recentJournals = await db.teachingJournal.findMany({
      where: journalWhere,
      include: {
        teacher: { select: { name: true } },
        class: { select: { name: true } },
      },
      orderBy: { sessionDate: "desc" },
      take: 5,
    });
  }

  const cards = isFinance
    ? [
        { label: "Tagihan Belum Bayar", value: formatCurrency(stats.unpaidAmount), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", trend: "IDR" },
        { label: "PPDB Pending", value: stats.pendingPpdb, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50", trend: "antrian" },
        { label: "Komisi Pending", value: stats.pendingCommissions, icon: Share2, color: "text-yellow-600", bg: "bg-yellow-50", trend: "item" },
        { label: "Afiliator Aktif", value: stats.totalAffiliates, icon: Share2, color: "text-pink-600", bg: "bg-pink-50", trend: "orang" },
      ]
    : isAcademic
    ? [
        { label: "Total Siswa", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "aktif" },
        { label: "Total Guru", value: stats.totalTeachers, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", trend: "aktif" },
        { label: "Kelas Aktif", value: stats.totalClasses, icon: BookOpen, color: "text-green-600", bg: "bg-green-50", trend: "kelas" },
        { label: "PPDB Pending", value: stats.pendingPpdb, icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50", trend: "antrian" },
      ]
    : [
        { label: "Total Siswa", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%" },
        { label: "Total Guru", value: stats.totalTeachers, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", trend: "+2%" },
        { label: "Kelas Aktif", value: stats.totalClasses, icon: BookOpen, color: "text-green-600", bg: "bg-green-50", trend: "+5%" },
        { label: "Tagihan Belum Bayar", value: formatCurrency(stats.unpaidAmount), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", trend: "IDR" },
        ...(isSuperAdmin || isCabang ? [{ label: "Fitur Aktif", value: `${stats.activeFlags} / 29`, icon: CheckSquare, color: "text-teal-600", bg: "bg-teal-50", trend: "modul" }] : []),
      ];

  const moduleCards = isFinance
    ? [
        { label: "PPDB Pending", value: stats.pendingPpdb, href: "/admin/ppdb", icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Afiliator Aktif", value: stats.totalAffiliates, href: "/admin/afiliator", icon: Share2, color: "text-pink-600", bg: "bg-pink-50" },
        { label: "Komisi Pending", value: stats.pendingCommissions, href: "/admin/afiliator/komisi", icon: Wallet, color: "text-yellow-600", bg: "bg-yellow-50" },
        { label: "Laporan Keuangan", value: "Buka", href: "/admin/finance/laporan", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
      ]
    : isAcademic
    ? [
        { label: "Kelas Aktif", value: stats.totalClasses, href: "/admin/classes", icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
        { label: "PPDB Pending", value: stats.pendingPpdb, href: "/admin/ppdb", icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Total Guru", value: stats.totalTeachers, href: "/admin/users", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Total Siswa", value: stats.totalStudents, href: "/admin/users", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      ]
    : [
        { label: "PPDB Pending", value: stats.pendingPpdb, href: "/admin/ppdb", icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Afiliator Aktif", value: stats.totalAffiliates, href: "/admin/afiliator", icon: Share2, color: "text-pink-600", bg: "bg-pink-50" },
        { label: "Komisi Pending", value: stats.pendingCommissions, href: "/admin/afiliator/komisi", icon: Wallet, color: "text-yellow-600", bg: "bg-yellow-50" },
        ...(isSuperAdmin ? [
          { label: "Landing Pages", value: stats.activeLandingPages, href: "/admin/landing-pages", icon: Globe, color: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "FAQ Aktif", value: stats.totalFaqs, href: "/admin/faq", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
        ] : []),
      ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Selamat datang, {session?.user?.name} 👋</h2>
        <p className="text-blue-100 text-sm mt-1">
          Berikut ringkasan aktivitas lembaga hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-xs text-gray-400">{card.trend}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Module Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistik Modul</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {moduleCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.label}
                href={card.href}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </a>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-2">
            {[
              { label: "Tambah Siswa Baru", href: "/admin/users/new", icon: Users },
              { label: "Buat Kelas Baru", href: "/admin/classes/new", icon: CalendarDays },
              { label: "Kelola Fitur & Modul", href: "/admin/features", icon: CheckSquare },
              { label: "Lihat Laporan Keuangan", href: "/admin/finance", icon: TrendingUp },
              { label: "Review PPDB", href: "/admin/ppdb", icon: UserCheck },
              { label: "Kelola Landing Page", href: "/admin/landing-pages", icon: Globe },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Status Fitur</h3>
            <a href="/admin/features" className="text-xs text-blue-600 hover:underline">
              Kelola semua →
            </a>
          </div>
          <div className="space-y-2">
            {[
              { name: "Materi Pembelajaran", active: true },
              { name: "Ujian Online", active: true },
              { name: "PPDB Online", active: true },
              { name: "Sistem Afiliator", active: true },
              { name: "Pembayaran Online", active: false },
              { name: "Kelas Live", active: false },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700">{item.name}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {item.active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAcademic && recentJournals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Jurnal Mengajar Terbaru</h3>
            </div>
            <a href="/admin/jurnal" className="text-xs text-blue-600 hover:underline">Lihat semua →</a>
          </div>
          <div className="space-y-2">
            {recentJournals.map((j) => (
              <div key={j.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{j.activity}</p>
                  <p className="text-xs text-gray-500">{j.teacher.name} • {j.class.name}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(j.sessionDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${j.status === "APPROVED" ? "bg-green-100 text-green-700" : j.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <DashboardCharts />
      )}
    </div>
  );
}
