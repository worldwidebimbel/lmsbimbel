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

  // ===== Header config values =====
  const headerType = cfg.header_type ?? "default"; // "default" | "simple"
  const isSimple = headerType === "simple";
  const showTopbar = !isSimple && (cfg.header_show_topbar ?? "true") === "true";
  const showBottombar = !isSimple && (cfg.header_show_bottombar ?? "true") === "true";
  const sticky = (cfg.header_sticky ?? "true") === "true";
  const widthMode = cfg.header_width_mode ?? "full_width"; // "full_width" | "full_screen"
  const mainbarMode = cfg.header_mainbar_mode ?? "light"; // "light" | "dark"
  const mainbarMaxHeight = parseInt(cfg.header_mainbar_max_height ?? "80", 10);
  const fontSize = parseInt(cfg.header_menu_font_size ?? "14", 10);

  const topbarBg = cfg.header_topbar_bg ?? "#1e3a5f";
  const topbarText = cfg.header_topbar_text ?? "#ffffff";
  const bottombarBg = cfg.header_bottombar_bg ?? "#1e40af";
  const bottombarText = cfg.header_menu_text ?? "#ffffff";
  const menuHover = cfg.header_menu_hover ?? "#eab308";
  const menuActive = cfg.header_menu_active ?? "#eab308";
  const hoverEffect = cfg.header_menu_hover_effect ?? "color"; // color | background | line
  const ctaBg = cfg.header_cta_bg ?? "#22c55e";
  const ctaText = cfg.header_cta_text ?? "#ffffff";
  const waBg = cfg.header_whatsapp_bg ?? "#22c55e";
  const waText = cfg.header_whatsapp_text ?? "#ffffff";

  // Logo config — light untuk mainbar light mode, dark untuk mainbar dark mode
  const logoMaxWidth = parseInt(cfg.logoMaxWidth ?? "180", 10);
  const logoLight = cfg.logoUrl ?? "";
  const logoDark = cfg.logoDarkUrl ?? "";
  const mainbarDark = mainbarMode === "dark";
  const logoSrc = mainbarDark ? (logoDark || logoLight) : (logoLight || logoDark);

  const mainbarBg = mainbarMode === "dark" ? bottombarBg : "#ffffff";
  const mainbarText = mainbarMode === "dark" ? "#ffffff" : "#1f2937";
  const mainbarSubtext = mainbarMode === "dark" ? "rgba(255,255,255,0.6)" : "#6b7280";

  // Width class: full_width → max-w-7xl mx-auto, full_screen → w-full
  const widthClass = widthMode === "full_screen" ? "w-full px-4" : "mx-auto max-w-7xl px-4";

  // Hover class based on effect
  const menuHoverClass =
    hoverEffect === "background"
      ? "hover:bg-white/15"
      : hoverEffect === "line"
      ? "hover:border-b-2 hover:border-current"
      : ""; // color handled inline

  const stickyClass = sticky ? "sticky top-0 z-50" : "relative z-50";

  // ===== Simple Header (Mainbar only) =====
  if (isSimple) {
    return (
      <header className={`${stickyClass} shadow-sm`} style={{ backgroundColor: mainbarBg }}>
        <div className={`${widthClass} flex items-center justify-between`} style={{ minHeight: mainbarMaxHeight }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 py-3">
            {logoSrc ? (
              <Image src={logoSrc} alt={cfg.siteName} width={logoMaxWidth} height={80} className="object-contain" style={{ maxWidth: `${logoMaxWidth}px`, width: "100%", height: "auto", maxHeight: `${mainbarMaxHeight}px` }} />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.colorPrimary }}>
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: mainbarText }}>{cfg.siteName}</span>
              </>
            )}
          </Link>

          {/* Menu + CTA */}
          <div className="flex items-center gap-4">
            <div className="hidden flex-1 items-center gap-1 md:flex">
              {navMenus.map((menu) => (
                <div key={menu.id} className="group relative">
                  <Link
                    href={menu.href ?? "#"}
                    {...(menu.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`flex items-center gap-1 px-3 py-2 font-semibold transition-colors ${menuHoverClass}`}
                    style={{ color: bottombarText, fontSize: `${fontSize}px` }}
                    onMouseEnter={(e) => { if (hoverEffect === "color") (e.currentTarget as HTMLElement).style.color = menuHover; }}
                    onMouseLeave={(e) => { if (hoverEffect === "color") (e.currentTarget as HTMLElement).style.color = bottombarText; }}
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

            {/* CTA / WhatsApp */}
            <a
              href={`https://wa.me/${cfg.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: waBg, color: waText }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat WhatsApp</span>
            </a>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="rounded-lg p-2 hover:bg-white/10 md:hidden"
              style={{ color: mainbarText }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-gray-200 px-4 py-4 md:hidden" style={{ backgroundColor: mainbarBg }}>
            <nav className="flex flex-col gap-1">
              {navMenus.map((menu) => (
                <div key={menu.id}>
                  <Link
                    href={menu.href ?? "#"}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 font-semibold"
                    style={{ color: mainbarText }}
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
                          className="py-1.5 text-sm"
                          style={{ color: mainbarSubtext }}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>
    );
  }

  // ===== Default Header (Topbar + Mainbar + Bottombar) =====
  return (
    <header className={`${stickyClass} shadow-sm`}>
      {/* Baris 1: Topbar */}
      {showTopbar && (
        <div style={{ backgroundColor: topbarBg, color: topbarText }}>
          <div className={`${widthClass} flex items-center justify-between py-2 text-xs`}>
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
                  className="font-semibold tracking-wide transition-colors hover:text-yellow-400"
                  style={{ color: topbarText, opacity: 0.8 }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Baris 2: Mainbar (info) */}
      <div className="border-b" style={{ backgroundColor: mainbarBg, borderColor: mainbarMode === "dark" ? "rgba(255,255,255,0.1)" : "#f3f4f6" }}>
        <div className={`${widthClass} flex items-center justify-between py-3`} style={{ minHeight: mainbarMaxHeight }}>
          <Link href="/" className="flex items-center gap-2">
            {logoSrc ? (
              <Image src={logoSrc} alt={cfg.siteName} width={logoMaxWidth} height={80} className="object-contain" style={{ maxWidth: `${logoMaxWidth}px`, width: "100%", height: "auto", maxHeight: `${mainbarMaxHeight}px` }} />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.colorPrimary }}>
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: mainbarText }}>{cfg.siteName}</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-4">
            {/* Email */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: cfg.colorSecondary }}>
                <Mail className="h-4 w-4" style={{ color: mainbarMode === "dark" ? "#1e3a5f" : "#1e3a5f" }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase" style={{ color: mainbarSubtext }}>Email</span>
                <span className="text-xs font-semibold" style={{ color: mainbarText }}>{cfg.email}</span>
              </div>
            </div>

            {/* Call Center */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: cfg.colorSecondary }}>
                <Phone className="h-4 w-4" style={{ color: "#1e3a5f" }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase" style={{ color: mainbarSubtext }}>Call Center</span>
                <span className="text-xs font-semibold" style={{ color: mainbarText }}>{cfg.phone}</span>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${cfg.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: waBg, color: waText }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Baris 3: Bottombar (navbar) */}
      {showBottombar && (
        <nav style={{ backgroundColor: bottombarBg, color: bottombarText }}>
          <div className={`${widthClass} flex items-center justify-between`}>
            <div className="hidden flex-1 items-center gap-1 md:flex">
              {navMenus.map((menu) => (
                <div key={menu.id} className="group relative">
                  <Link
                    href={menu.href ?? "#"}
                    {...(menu.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`flex items-center gap-1 px-3 py-3 font-semibold transition-colors ${menuHoverClass}`}
                    style={{ color: bottombarText, fontSize: `${fontSize}px` }}
                    onMouseEnter={(e) => { if (hoverEffect === "color") (e.currentTarget as HTMLElement).style.color = menuHover; }}
                    onMouseLeave={(e) => { if (hoverEffect === "color") (e.currentTarget as HTMLElement).style.color = bottombarText; }}
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
                  <button type="submit" className="rounded-r-md px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: cfg.colorSecondary, color: "#1e3a5f" }}>
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-1 px-3 py-3 text-sm font-semibold hover:bg-white/15"
                  style={{ color: bottombarText }}
                >
                  <Search className="h-4 w-4" />
                  CARI PROGRAM
                </button>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="rounded-lg p-2 hover:bg-white/15 md:hidden"
              style={{ color: bottombarText }}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="border-t px-4 py-4 md:hidden" style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: bottombarBg }}>
              <nav className="flex flex-col gap-1">
                {navMenus.map((menu) => (
                  <div key={menu.id}>
                    <Link
                      href={menu.href ?? "#"}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm font-semibold"
                      style={{ color: bottombarText }}
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
                            className="py-1.5 text-sm"
                            style={{ color: "rgba(255,255,255,0.8)" }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="mt-2 border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
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
                    <button type="submit" className="rounded-r-md px-3 py-2 text-sm font-bold" style={{ backgroundColor: cfg.colorSecondary, color: "#1e3a5f" }}>
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </nav>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
