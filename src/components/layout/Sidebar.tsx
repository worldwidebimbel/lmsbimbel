"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CalendarDays, BookOpen, ClipboardList,
  FileCheck, CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, MessagesSquare, MessageSquare, Video, Gamepad2, Award,
  Users2, Settings, ToggleLeft, BookMarked, Database, Trophy, QrCode,
  Mail, Smartphone, TrendingUp, Building2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, CalendarDays, BookOpen, ClipboardList,
  FileCheck, CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, MessagesSquare, MessageSquare, Video, Gamepad2, Award,
  Users2, Settings, ToggleLeft, BookMarked, Database, Trophy, QrCode,
  Mail, Smartphone, TrendingUp, Building2,
};

interface NavItem {
  title: string;
  href: string;
  icon: string;
  featureFlag?: string;
}

const NAV_ADMIN: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "Fitur & Modul", href: "/admin/features", icon: "ToggleLeft" },
  { title: "Pengguna", href: "/admin/users", icon: "Users", featureFlag: "FEAT_USER_MANAGEMENT" },
  { title: "Orang Tua & Anak", href: "/admin/parents", icon: "Users2" },
  { title: "Kelas & Jadwal", href: "/admin/classes", icon: "CalendarDays", featureFlag: "FEAT_CLASS_SCHEDULE" },
  { title: "Keuangan", href: "/admin/finance", icon: "Wallet", featureFlag: "FEAT_PAYMENT_MANUAL" },
  { title: "Multi-Cabang", href: "/admin/branches", icon: "Building2", featureFlag: "FEAT_MULTI_BRANCH" },
  { title: "Analitik", href: "/admin/analytics", icon: "BarChart3", featureFlag: "FEAT_ANALYTICS" },
  { title: "Pengumuman", href: "/admin/announcements", icon: "Megaphone", featureFlag: "FEAT_ANNOUNCEMENTS" },
  { title: "Event Berbayar", href: "/admin/events", icon: "Trophy", featureFlag: "FEAT_EVENTS" },
  { title: "Pengaturan", href: "/admin/settings", icon: "Settings" },
];

const NAV_GURU: NavItem[] = [
  { title: "Dashboard", href: "/guru", icon: "LayoutDashboard" },
  { title: "Kelas Saya", href: "/guru/kelas", icon: "BookMarked", featureFlag: "FEAT_CLASS_SCHEDULE" },
  { title: "Materi", href: "/guru/materi", icon: "BookOpen", featureFlag: "FEAT_MATERIALS" },
  { title: "Tugas", href: "/guru/tugas", icon: "ClipboardList", featureFlag: "FEAT_ASSIGNMENTS" },
  { title: "Ujian", href: "/guru/ujian", icon: "FileCheck" },
  { title: "Bank Soal", href: "/guru/bank-soal", icon: "Database" },
  { title: "Absensi", href: "/guru/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Nilai", href: "/guru/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Forum", href: "/guru/forum", icon: "MessagesSquare", featureFlag: "FEAT_FORUM" },
  { title: "Chat", href: "/guru/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
  { title: "Kelas Live", href: "/guru/live", icon: "Video", featureFlag: "FEAT_LIVE_CLASS" },
];

const NAV_SISWA: NavItem[] = [
  { title: "Dashboard", href: "/siswa", icon: "LayoutDashboard" },
  { title: "Progress", href: "/siswa/progress", icon: "TrendingUp" },
  { title: "Jadwal", href: "/siswa/jadwal", icon: "CalendarDays", featureFlag: "FEAT_CLASS_SCHEDULE" },
  { title: "Materi", href: "/siswa/materi", icon: "BookOpen", featureFlag: "FEAT_MATERIALS" },
  { title: "Tugas", href: "/siswa/tugas", icon: "ClipboardList", featureFlag: "FEAT_ASSIGNMENTS" },
  { title: "Ujian", href: "/siswa/ujian", icon: "FileCheck" },
  { title: "Tryout", href: "/siswa/tryout", icon: "Trophy", featureFlag: "FEAT_TRYOUT" },
  { title: "Absensi", href: "/siswa/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Nilai", href: "/siswa/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Tagihan", href: "/siswa/tagihan", icon: "Wallet", featureFlag: "FEAT_PAYMENT_MANUAL" },
  { title: "Forum", href: "/siswa/forum", icon: "MessagesSquare", featureFlag: "FEAT_FORUM" },
  { title: "Chat", href: "/siswa/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
  { title: "Prestasi", href: "/siswa/prestasi", icon: "Gamepad2", featureFlag: "FEAT_GAMIFICATION" },
  { title: "Kelas Live", href: "/siswa/live", icon: "Video", featureFlag: "FEAT_LIVE_CLASS" },
];

const NAV_ORANGTUA: NavItem[] = [
  { title: "Dashboard", href: "/orangtua", icon: "LayoutDashboard" },
  { title: "Hubungkan Anak", href: "/orangtua/link-anak", icon: "Users2" },
  { title: "Progress Anak", href: "/orangtua/progress", icon: "BarChart3" },
  { title: "Absensi Anak", href: "/orangtua/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Nilai Anak", href: "/orangtua/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Tagihan", href: "/orangtua/tagihan", icon: "Wallet" },
  { title: "Chat dengan Guru", href: "/orangtua/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
];

const NAV_MAP: Record<string, NavItem[]> = {
  SUPER_ADMIN: NAV_ADMIN,
  ADMIN: NAV_ADMIN,
  GURU: NAV_GURU,
  SISWA: NAV_SISWA,
  ORANG_TUA: NAV_ORANGTUA,
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  GURU: "Guru",
  SISWA: "Siswa",
  ORANG_TUA: "Orang Tua",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500",
  ADMIN: "bg-orange-500",
  GURU: "bg-yellow-500",
  SISWA: "bg-green-500",
  ORANG_TUA: "bg-blue-500",
};

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { isFeatureActive, isLoading } = useFeatureFlags();
  const navItems = NAV_MAP[role] ?? [];

  const visibleItems = navItems.filter((item) => {
    if (!item.featureFlag) return true;
    if (isLoading) return false;
    return isFeatureActive(item.featureFlag);
  });

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col z-40 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-none">EduBimbel</p>
          <p className="text-sidebar-foreground/50 text-[10px] mt-0.5">LMS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href.split("/").length > 2);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-primary text-white shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", ROLE_COLORS[role] ?? "bg-gray-500")}>
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-sidebar-foreground/60 text-xs truncate">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
