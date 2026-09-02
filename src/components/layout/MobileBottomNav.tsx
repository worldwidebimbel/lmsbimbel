"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Wallet, User, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "SISWA" | "ORANG_TUA";

const MENUS: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  SISWA: [
    { href: "/siswa", label: "Home", icon: Home },
    { href: "/siswa/materi", label: "Materi", icon: BookOpen },
    { href: "/siswa/tagihan", label: "Tagihan", icon: Wallet },
    { href: "/profile", label: "Profil", icon: User },
  ],
  ORANG_TUA: [
    { href: "/orangtua", label: "Home", icon: Home },
    { href: "/orangtua/nilai", label: "Nilai", icon: BarChart3 },
    { href: "/orangtua/tagihan", label: "Tagihan", icon: Wallet },
    { href: "/profile", label: "Profil", icon: User },
  ],
};

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = MENUS[role];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur"
      aria-label="Navigasi bawah"
    >
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/siswa" && item.href !== "/orangtua" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
