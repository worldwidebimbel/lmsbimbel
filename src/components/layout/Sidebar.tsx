"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { useSidebarStore } from "@/lib/sidebar-store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CalendarDays, BookOpen, ClipboardList,
  FileCheck, CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, MessagesSquare, MessageSquare, Video, Gamepad2, Award,
  Users2, Settings, ToggleLeft, BookMarked, Database, Trophy, QrCode,
  Mail, Smartphone, TrendingUp, Building2, Globe, Image, User,
  DoorOpen, ScrollText, Share2, DollarSign, UserCheck, FileText,
  NotebookPen, Clock, Zap, ChevronDown, HelpCircle,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, CalendarDays, BookOpen, ClipboardList,
  FileCheck, CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, MessagesSquare, MessageSquare, Video, Gamepad2, Award,
  Users2, Settings, ToggleLeft, BookMarked, Database, Trophy, QrCode,
  Mail, Smartphone, TrendingUp, Building2, Globe, Image, User,
  DoorOpen, ScrollText, Share2, DollarSign, UserCheck, FileText,
  NotebookPen, Clock, Zap, ChevronDown, HelpCircle,
};

interface NavItem {
  title: string;
  href: string;
  icon: string;
  featureFlag?: string;
  superAdminOnly?: boolean;
  roles?: string[];
  children?: NavItem[];
}

const ALL_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN", "ADMIN_AKADEMIK"];

const NAV_ADMIN: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { title: "Fitur & Modul", href: "/admin/features", icon: "ToggleLeft", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Pengguna", href: "/admin/users", icon: "Users", featureFlag: "FEAT_USER_MANAGEMENT", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Orang Tua & Anak", href: "/admin/parents", icon: "Users2", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Kelas & Jadwal", href: "/admin/classes", icon: "CalendarDays", featureFlag: "FEAT_CLASS_SCHEDULE", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Kalender Akademik", href: "/admin/academic-calendar", icon: "CalendarDays", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Keuangan", href: "/admin/finance", icon: "Wallet", featureFlag: "FEAT_PAYMENT_MANUAL", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN"] },
  { title: "Multi-Cabang", href: "/admin/branches", icon: "Building2", featureFlag: "FEAT_MULTI_BRANCH", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "PPDB", href: "/admin/ppdb", icon: "UserCheck", featureFlag: "FEAT_PPDB", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN"] },
  { title: "Afiliator", href: "/admin/afiliator", icon: "Share2", featureFlag: "FEAT_AFFILIATE", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_KEUANGAN"] },
  { title: "Program & Jenjang", href: "/admin/master/programs", icon: "GraduationCap", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Gedung & Ruangan", href: "/admin/master/ruangan", icon: "DoorOpen", featureFlag: "FEAT_ROOM_MANAGEMENT", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Tutor - Absensi", href: "/admin/tutor/absensi", icon: "CheckSquare", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Tutor - Payroll", href: "/admin/tutor/payroll", icon: "Wallet", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_KEUANGAN"] },
  { title: "Analitik", href: "/admin/analytics", icon: "BarChart3", featureFlag: "FEAT_ANALYTICS", roles: ALL_ADMIN_ROLES },
  { title: "Audit Log", href: "/admin/audit-log", icon: "ScrollText", superAdminOnly: true },
  { title: "Pengumuman", href: "/admin/announcements", icon: "Megaphone", featureFlag: "FEAT_ANNOUNCEMENTS", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Event Berbayar", href: "/admin/events", icon: "Trophy", featureFlag: "FEAT_EVENTS", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Jurnal Mengajar", href: "/admin/jurnal", icon: "NotebookPen", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Raport", href: "/admin/raport", icon: "FileText", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Bank Soal", href: "/admin/bank-soal", icon: "Database", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"] },
  { title: "Sertifikat", href: "/admin/sertifikat", icon: "Award", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Sertifikat Template", href: "/admin/sertifikat/templates", icon: "Award", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  { title: "Media Manager", href: "/admin/media", icon: "Image", roles: ["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG"] },
  {
    title: "CMS",
    href: "/admin/cms",
    icon: "Globe",
    roles: ["SUPER_ADMIN", "ADMIN"],
    children: [
      { title: "Homepage", href: "/admin/cms/settings", icon: "Settings", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Banner", href: "/admin/cms/banner", icon: "Image", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Program", href: "/admin/cms/program", icon: "GraduationCap", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Video", href: "/admin/cms/video", icon: "Video", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Testimoni", href: "/admin/cms/testimonial", icon: "MessageSquare", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Menu", href: "/admin/cms/menu", icon: "BookOpen", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Quick Actions", href: "/admin/cms/quick-actions", icon: "Zap", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Social Links", href: "/admin/cms/social-links", icon: "Share2", roles: ["SUPER_ADMIN", "ADMIN"] },
      { title: "Landing Pages", href: "/admin/landing-pages", icon: "Globe", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  { title: "FAQ & Tim", href: "/admin/faq", icon: "FileText", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Site Gallery", href: "/admin/site", icon: "Image", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Pengaturan", href: "/admin/settings", icon: "Settings", roles: ["SUPER_ADMIN", "ADMIN"] },
  { title: "Guidance", href: "/admin/guidance", icon: "HelpCircle", roles: ALL_ADMIN_ROLES },
  { title: "Profil Saya", href: "/profile", icon: "User" },
];

const NAV_GURU: NavItem[] = [
  { title: "Dashboard", href: "/guru", icon: "LayoutDashboard" },
  { title: "Kelas Saya", href: "/guru/kelas", icon: "BookMarked", featureFlag: "FEAT_CLASS_SCHEDULE" },
  { title: "Kalender Akademik", href: "/guru/kalender", icon: "CalendarDays" },
  { title: "Materi", href: "/guru/materi", icon: "BookOpen", featureFlag: "FEAT_MATERIALS" },
  { title: "Tugas", href: "/guru/tugas", icon: "ClipboardList", featureFlag: "FEAT_ASSIGNMENTS" },
  { title: "Ujian", href: "/guru/ujian", icon: "FileCheck" },
  { title: "Jurnal Mengajar", href: "/guru/jurnal", icon: "NotebookPen" },
  { title: "Raport", href: "/guru/raport", icon: "FileText" },
  { title: "Bank Soal", href: "/guru/bank-soal", icon: "Database" },
  { title: "Absensi Siswa", href: "/guru/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Absensi Tutor", href: "/guru/absensi-tutor", icon: "Clock" },
  { title: "Nilai", href: "/guru/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Forum", href: "/guru/forum", icon: "MessagesSquare", featureFlag: "FEAT_FORUM" },
  { title: "Chat", href: "/guru/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
  { title: "Kelas Live", href: "/guru/live", icon: "Video", featureFlag: "FEAT_LIVE_CLASS" },
  { title: "Profil Saya", href: "/profile", icon: "User" },
];

const NAV_SISWA: NavItem[] = [
  { title: "Dashboard", href: "/siswa", icon: "LayoutDashboard" },
  { title: "Progress", href: "/siswa/progress", icon: "TrendingUp" },
  { title: "Jadwal", href: "/siswa/jadwal", icon: "CalendarDays", featureFlag: "FEAT_CLASS_SCHEDULE" },
  { title: "Kalender Akademik", href: "/siswa/kalender", icon: "CalendarDays" },
  { title: "Materi", href: "/siswa/materi", icon: "BookOpen", featureFlag: "FEAT_MATERIALS" },
  { title: "Tugas", href: "/siswa/tugas", icon: "ClipboardList", featureFlag: "FEAT_ASSIGNMENTS" },
  { title: "Ujian", href: "/siswa/ujian", icon: "FileCheck" },
  { title: "Tryout", href: "/siswa/tryout", icon: "Trophy", featureFlag: "FEAT_TRYOUT" },
  { title: "Absensi", href: "/siswa/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Nilai", href: "/siswa/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Raport", href: "/siswa/raport", icon: "FileText" },
  { title: "Sertifikat", href: "/siswa/sertifikat", icon: "Award" },
  { title: "Tagihan", href: "/siswa/tagihan", icon: "Wallet", featureFlag: "FEAT_PAYMENT_MANUAL" },
  { title: "Forum", href: "/siswa/forum", icon: "MessagesSquare", featureFlag: "FEAT_FORUM" },
  { title: "Chat", href: "/siswa/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
  { title: "Prestasi", href: "/siswa/prestasi", icon: "Gamepad2", featureFlag: "FEAT_GAMIFICATION" },
  { title: "Kelas Live", href: "/siswa/live", icon: "Video", featureFlag: "FEAT_LIVE_CLASS" },
  { title: "Profil Saya", href: "/profile", icon: "User" },
];

const NAV_ORANGTUA: NavItem[] = [
  { title: "Dashboard", href: "/orangtua", icon: "LayoutDashboard" },
  { title: "Hubungkan Anak", href: "/orangtua/link-anak", icon: "Users2" },
  { title: "Progress Anak", href: "/orangtua/progress", icon: "BarChart3" },
  { title: "Absensi Anak", href: "/orangtua/absensi", icon: "CheckSquare", featureFlag: "FEAT_ATTENDANCE" },
  { title: "Nilai Anak", href: "/orangtua/nilai", icon: "GraduationCap", featureFlag: "FEAT_GRADES" },
  { title: "Raport Anak", href: "/orangtua/raport", icon: "FileText" },
  { title: "Tagihan", href: "/orangtua/tagihan", icon: "Wallet" },
  { title: "Chat dengan Guru", href: "/orangtua/chat", icon: "MessageSquare", featureFlag: "FEAT_CHAT" },
  { title: "Profil Saya", href: "/profile", icon: "User" },
];

const NAV_AFILIATOR: NavItem[] = [
  { title: "Dashboard", href: "/afiliator", icon: "LayoutDashboard" },
  { title: "Profil Saya", href: "/profile", icon: "User" },
];

const NAV_MAP: Record<string, NavItem[]> = {
  SUPER_ADMIN: NAV_ADMIN,
  ADMIN: NAV_ADMIN,
  ADMIN_CABANG: NAV_ADMIN,
  ADMIN_KEUANGAN: NAV_ADMIN,
  ADMIN_AKADEMIK: NAV_ADMIN,
  GURU: NAV_GURU,
  SISWA: NAV_SISWA,
  ORANG_TUA: NAV_ORANGTUA,
  AFILIATOR: NAV_AFILIATOR,
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ADMIN_CABANG: "Admin Cabang",
  ADMIN_KEUANGAN: "Admin Keuangan",
  ADMIN_AKADEMIK: "Admin Akademik",
  GURU: "Guru",
  SISWA: "Siswa",
  ORANG_TUA: "Orang Tua",
  AFILIATOR: "Afiliator",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-500",
  ADMIN: "bg-orange-500",
  ADMIN_CABANG: "bg-amber-500",
  ADMIN_KEUANGAN: "bg-emerald-500",
  ADMIN_AKADEMIK: "bg-indigo-500",
  GURU: "bg-yellow-500",
  SISWA: "bg-green-500",
  ORANG_TUA: "bg-blue-500",
  AFILIATOR: "bg-purple-500",
};

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
  siteName?: string;
  logoUrl?: string;
}

export function Sidebar({ role, userName, userEmail, siteName, logoUrl }: SidebarProps) {
  const pathname = usePathname();
  const { isFeatureActive, isLoading } = useFeatureFlags();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const navItems = NAV_MAP[role] ?? [];
  const { mobileOpen, setMobileOpen } = useSidebarStore();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const filterItem = (item: NavItem): boolean => {
    if (item.superAdminOnly && role !== "SUPER_ADMIN") return false;
    if (item.roles && !item.roles.includes(role)) return false;
    if (!item.featureFlag) return true;
    if (isLoading) return false;
    return isFeatureActive(item.featureFlag);
  };

  const visibleItems = navItems.filter((item) => {
    if (!filterItem(item)) return false;
    if (item.children) {
      const visibleChildren = item.children.filter(filterItem);
      if (visibleChildren.length === 0) return false;
    }
    return true;
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isGroupActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.href || pathname.startsWith(child.href));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-sidebar flex flex-col z-40 border-r border-sidebar-border transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName ?? "LMS"} className="h-8 w-auto max-w-[140px] object-contain" />
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">{siteName ?? "EduBimbel"}</p>
              <p className="text-sidebar-foreground/50 text-[10px] mt-0.5">LMS</p>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

            // Collapsible group
            if (item.children) {
              const visibleChildren = item.children.filter(filterItem);
              const groupActive = isGroupActive(item);
              const isExpanded = expandedGroups[item.title] ?? groupActive;

              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleGroup(item.title)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      groupActive
                        ? "text-white"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                  {isExpanded && (
                    <div className="mt-0.5 ml-4 space-y-0.5 border-l border-sidebar-border pl-2">
                      {visibleChildren.map((child) => {
                        const ChildIcon = ICON_MAP[child.icon] ?? LayoutDashboard;
                        const childActive = pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href) && child.href.split("/").length > 2);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                              childActive
                                ? "bg-sidebar-primary text-white shadow-sm"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                            )}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular link
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
    </>
  );
}
