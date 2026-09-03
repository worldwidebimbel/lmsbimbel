import Link from "next/link";
import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";
import { SITE_DEFAULTS } from "@/lib/site-config";

interface Props {
  config: typeof SITE_DEFAULTS;
}

export default function PublicFooter({ config: cfg }: Props) {
  return (
    <footer id="kontak" className="border-t border-gray-100 bg-gray-50 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              {cfg.logoUrl ? (
                <img src={cfg.logoUrl} alt={cfg.siteName} className="h-9 w-auto max-w-[160px] object-contain" />
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
            <p className="mt-4 text-sm text-gray-500">
              Lembaga bimbingan belajar terpercaya dengan sistem pembelajaran modern dan guru berkualitas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Program</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-500">
              <li><Link href="/#program" className="hover:text-blue-600">SD Kelas 4-6</Link></li>
              <li><Link href="/#program" className="hover:text-blue-600">SMP Kelas 7-9</Link></li>
              <li><Link href="/#program" className="hover:text-blue-600">SMA Kelas 10-12</Link></li>
              <li><Link href="/#program" className="hover:text-blue-600">UTBK Preparation</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Tautan</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-500">
              <li><Link href="/#statistik" className="hover:text-blue-600">Tentang Kami</Link></li>
              <li><Link href="/#daftar" className="hover:text-blue-600">Cara Daftar</Link></li>
              <li><Link href="/login" className="hover:text-blue-600">Masuk Akun</Link></li>
              <li><Link href="/events" className="hover:text-blue-600">Event & Tryout</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-blue-600">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-blue-600">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Kontak</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" /> {cfg.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" /> {cfg.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" /> {cfg.email}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {cfg.siteName} LMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
