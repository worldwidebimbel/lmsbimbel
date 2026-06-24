import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SITE_DEFAULTS } from "@/lib/site-config";

interface Props {
  config: typeof SITE_DEFAULTS;
}

export default function PublicHeader({ config: cfg }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
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
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#program" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Program
          </Link>
          <Link href="/#statistik" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Statistik
          </Link>
          <Link href="/#testimoni" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Testimoni
          </Link>
          <Link href="/events" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Event
          </Link>
          <Link href="/#kontak" className="text-sm font-medium text-gray-600 hover:text-blue-600">
            Kontak
          </Link>
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
        </div>
      </div>
    </header>
  );
}
