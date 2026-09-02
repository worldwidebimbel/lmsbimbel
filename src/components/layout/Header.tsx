"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/sidebar-store";
import { NotificationBell } from "@/components/layout/NotificationBell";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";
import Link from "next/link";

interface HeaderProps {
  title: string;
  userName: string;
  role: string;
  userImage?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  GURU: "Guru",
  SISWA: "Siswa",
  ORANG_TUA: "Orang Tua",
};

export function Header({ title, userName, role, userImage }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: session } = useSession();
  const { toggle } = useSidebarStore();

  const displayName = session?.user?.name ?? userName;
  const displayImage = session?.user?.image ?? userImage;
  const displayRole = session?.user?.role ?? role;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {displayImage ? (
              <img src={displayImage} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">{displayName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[displayRole]}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showDropdown && "rotate-180")} />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
                <Link href="/profile" onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4" />
                  Profil Saya
                </Link>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
