"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Menu, X, Mail, Phone, ChevronDown, Search, MessageCircle } from "lucide-react";
import { SITE_DEFAULTS } from "@/lib/site-config";

interface MenuChild {
  id: string;
  label: string;
  href: string | null;
  openInNewTab: boolean;
}

interface MenuNode {
  id: string;
  label: string;
  href: string | null;
  openInNewTab: boolean;
  children: MenuChild[];
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
}

interface Props {
  config: typeof SITE_DEFAULTS;
  menus?: MenuNode[];
  socialLinks?: SocialLink[];
}

const SOCIAL_ICONS: Record<string, string> = {
  facebook: "f",
  instagram: "ig",
  youtube: "yt",
  twitter: "x",
  tiktok: "tt",
  linkedin: "in",
};

const TOPBAR_LINKS = [
  { href: "/login", label: "REGISTER" },
  { href: "/ppdb", label: "APPLY ONLINE" },
  { href: "/blog", label: "BLOG" },
  { href: "/faq", label: "FAQS" },
];

const DEFAULT_MENUS: MenuNode[] = [
  { id: "home", label: "HOME", href: "/", openInNewTab: false, children: [] },
  { id: "tentang", label: "TENTANG KAMI", href: "/tentang", openInNewTab: false, children: [] },
  { id: "program", label: "PROGRAM", href: "/#program", openInNewTab: false, children: [] },
  { id: "galeri", label: "GALERI", href: "/galeri", openInNewTab: false, children: [] },
  { id: "testimoni", label: "TESTIMONI", href: "/#testimoni", openInNewTab: false, children: [] },
  { id: "kontak", label: "KONTAK", href: "/#kontak", openInNewTab: false, children: [] },
];

export default function PublicHeader({ config: cfg, menus, socialLinks }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navMenus = menus && menus.length > 0 ? menus : DEFAULT_MENUS;
  const socials = socialLinks ?? [];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Baris 1: Topbar gelap */}
      <div className="bg-blue-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-yellow-400 hover:text-blue-950"
                aria-label={s.platform}
              >
                <span className="text-[10px] font-bold uppercase">
                  {SOCIAL_ICONS[s.platform.toLowerCase()] ?? s.platform.slice(0, 2)}
                </span>
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            {TOPBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-semibold tracking-wide text-white/80 transition-colors hover:text-yellow-400"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Baris 2: Header info */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            {cfg.logoUrl ? (
              <Image src={cfg.logoUrl} alt={cfg.siteName} width={180} height={40} className="h-10 w-auto max-w-[180px] object-contain" />
            ) : (
              <>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: cfg.colorPrimary }}
                >
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">{cfg.siteName}</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-4">
            {/* Email */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400">
                <Mail className="h-4 w-4 text-blue-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase text-gray-400">Email</span>
                <span className="text-xs font-semibold text-gray-700">{cfg.email}</span>
              </div>
            </div>

            {/* Call Center */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400">
                <Phone className="h-4 w-4 text-blue-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase text-gray-400">Call Center</span>
                <span className="text-xs font-semibold text-gray-700">{cfg.phone}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${cfg.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Baris 3: Navbar biru */}
      <nav className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <div className="hidden flex-1 items-center gap-1 md:flex">
            {navMenus.map((menu) => (
              <div key={menu.id} className="group relative">
                <Link
                  href={menu.href ?? "#"}
                  {...(menu.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex items-center gap-1 px-3 py-3 text-sm font-semibold transition-colors hover:bg-blue-800 hover:text-yellow-400"
                >
                  {menu.label}
                  {menu.children.length > 0 && <ChevronDown className="h-3 w-3" />}
                </Link>
                {menu.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 min-w-[200px] rounded-b-lg bg-white py-2 text-gray-700 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    {menu.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href ?? "#"}
                        {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="block px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="hidden items-center md:flex">
            {searchOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) window.location.href = `/program?q=${encodeURIComponent(searchQuery)}`;
                }}
                className="flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="CARI PROGRAM..."
                  className="w-48 rounded-l-md px-3 py-1.5 text-sm text-gray-900 outline-none"
                  autoFocus
                />
                <button type="submit" className="rounded-r-md bg-yellow-400 px-3 py-1.5 text-sm font-bold text-blue-950">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1 px-3 py-3 text-sm font-semibold hover:bg-blue-800 hover:text-yellow-400"
              >
                <Search className="h-4 w-4" />
                CARI PROGRAM
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="rounded-lg p-2 text-white hover:bg-blue-800 md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-blue-800 bg-blue-900 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navMenus.map((menu) => (
                <div key={menu.id}>
                  <Link
                    href={menu.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm font-semibold text-white hover:text-yellow-400"
                  >
                    {menu.label}
                  </Link>
                  {menu.children.length > 0 && (
                    <div className="ml-4 flex flex-col gap-1">
                      {menu.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href ?? "#"}
                          onClick={() => setMobileOpen(false)}
                          className="py-1.5 text-sm text-white/80 hover:text-yellow-400"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-2 border-t border-blue-800 pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) window.location.href = `/program?q=${encodeURIComponent(searchQuery)}`;
                  }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="CARI PROGRAM..."
                    className="flex-1 rounded-l-md px-3 py-2 text-sm text-gray-900 outline-none"
                  />
                  <button type="submit" className="rounded-r-md bg-yellow-400 px-3 py-2 text-sm font-bold text-blue-950">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </nav>
          </div>
        )}
      </nav>
    </header>
  );
}
