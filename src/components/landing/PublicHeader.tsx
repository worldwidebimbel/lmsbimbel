"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { SITE_DEFAULTS } from "@/lib/site-config";

interface Props {
  config: typeof SITE_DEFAULTS;
}

const NAV_LINKS = [
  { href: "/#program", label: "Program" },
  { href: "/#statistik", label: "Statistik" },
  { href: "/#testimoni", label: "Testimoni" },
  { href: "/events", label: "Event" },
  { href: "/#kontak", label: "Kontak" },
];

export default function PublicHeader({ config: cfg }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          {cfg.logoUrl ? (
            <img src={cfg.logoUrl} alt={cfg.siteName} className="h-9 w-auto max-w-[140px] object-contain" />
          ) : (
            <>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: cfg.colorPrimary }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{cfg.siteName}</span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-gray-600 hover:text-blue-600 sm:block"
          >
            Masuk
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: cfg.colorPrimary }}
          >
            Daftar Sekarang
          </Link>
          <button
            onClick={() => setOpen((p) => !p)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              Masuk
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
