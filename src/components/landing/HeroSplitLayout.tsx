import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  titleHighlight: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

interface HeroSplitProps {
  banners: Banner[];
  tagline: string;
  description: string;
  colorPrimary: string;
  students: number;
}

export default function HeroSplitLayout({ banners, tagline, description, colorPrimary, students }: HeroSplitProps) {
  const b = banners[0] ?? null;

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold" style={{ color: colorPrimary }}>
              <Star className="h-3.5 w-3.5" /> Bimbingan Belajar Terbaik
            </div>
            {b ? (
              <>
                <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  {b.title}
                  {b.titleHighlight && <span className="text-yellow-500"> {b.titleHighlight}</span>}
                </h1>
                {b.subtitle && <p className="text-lg text-gray-600 max-w-lg">{b.subtitle}</p>}
              </>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  {tagline.split(" ").slice(0, -2).join(" ")} <br />
                  <span style={{ color: colorPrimary }}>{tagline.split(" ").slice(-2).join(" ")}</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg">{description}</p>
              </>
            )}
            <div className="flex flex-wrap gap-4">
              <Link
                href={b?.linkUrl || "/daftar"}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors"
                style={{ backgroundColor: colorPrimary }}
              >
                {b?.linkLabel || "Daftar Sekarang"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#program"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                Lihat Program
              </a>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-600">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{students}+</span> siswa telah bergabung
              </p>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative hidden lg:block">
            <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-blue-100 opacity-50 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
            {b?.imageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={b.imageUrl}
                  alt={b.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="50vw"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">01</div>
                    <div>
                      <p className="font-semibold text-gray-900">Pembelajaran Interaktif</p>
                      <p className="text-xs text-gray-500">Video, animasi, dan quiz</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-yellow-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 text-white text-sm font-bold">02</div>
                    <div>
                      <p className="font-semibold text-gray-900">Tryout Berkala</p>
                      <p className="text-xs text-gray-500">Simulasi ujian nasional</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white text-sm font-bold">03</div>
                    <div>
                      <p className="font-semibold text-gray-900">Guru Berpengalaman</p>
                      <p className="text-xs text-gray-500">Pengajar profesional</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
