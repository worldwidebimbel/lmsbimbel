import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import {
  Users, BookOpen, CalendarDays, TrendingUp,
  GraduationCap, CheckSquare, Wallet, ArrowUpRight,
} from "lucide-react";

async function getDashboardStats() {
  const [totalStudents, totalTeachers, totalClasses, unpaidInvoices, activeFlags] = await Promise.all([
    db.user.count({ where: { role: "SISWA", isActive: true } }),
    db.user.count({ where: { role: "GURU", isActive: true } }),
    db.class.count({ where: { isActive: true } }),
    db.invoice.aggregate({ where: { status: "UNPAID" }, _sum: { amount: true } }),
    db.featureFlag.count({ where: { isActive: true } }),
  ]);

  return { totalStudents, totalTeachers, totalClasses, unpaidAmount: unpaidInvoices._sum.amount ?? 0, activeFlags };
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total Siswa", value: stats.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%" },
    { label: "Total Guru", value: stats.totalTeachers, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", trend: "+2%" },
    { label: "Kelas Aktif", value: stats.totalClasses, icon: BookOpen, color: "text-green-600", bg: "bg-green-50", trend: "+5%" },
    { label: "Tagihan Belum Bayar", value: formatCurrency(stats.unpaidAmount), icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", trend: "IDR" },
    { label: "Fitur Aktif", value: `${stats.activeFlags} / 23`, icon: CheckSquare, color: "text-teal-600", bg: "bg-teal-50", trend: "modul" },
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
              { name: "Absensi QR Code", active: false },
              { name: "Pembayaran Online", active: false },
              { name: "Kelas Live", active: false },
              { name: "Portal Orang Tua", active: true },
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
    </div>
  );
}
