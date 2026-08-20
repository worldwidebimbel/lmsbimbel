import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ArrowRight, Phone } from "lucide-react";

interface ProgramFeature {
  title?: string;
  desc?: string;
}

interface Program {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  features: unknown;
  levelLabel: string | null;
  theme: string;
  imagePosition: string;
  linkUrl: string | null;
}

export default function ProgramUnggulanSection({ programs }: { programs: Program[] }) {
  if (!programs || programs.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            <span className="text-blue-900">PROGRAM </span>
            <span className="text-yellow-500">UNGGULAN</span>
          </h2>
          <p className="mt-3 text-gray-500">Program terbaik untuk kesuksesan akademik Anda</p>
        </div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {programs.slice(0, 4).map((program) => {
            const isYellow = program.theme === "yellow";
            const imageLeft = program.imagePosition === "left";
            const features = Array.isArray(program.features) ? (program.features as ProgramFeature[]) : [];

            return (
              <div
                key={program.id}
                className={`overflow-hidden rounded-2xl border shadow-lg ${isYellow ? "border-yellow-200" : "border-blue-200"}`}
              >
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${imageLeft ? "" : "sm:[&>*:first-child]:order-2"}`}>
                  {/* Image */}
                  <div className="relative aspect-square sm:aspect-auto bg-gray-100 min-h-[200px]">
                    {program.imageUrl ? (
                      <Image
                        src={program.imageUrl}
                        alt={program.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className={`flex h-full min-h-[200px] items-center justify-center ${isYellow ? "bg-yellow-100" : "bg-blue-100"}`}>
                        <span className="text-4xl font-bold text-gray-300">{program.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {program.levelLabel && (
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${isYellow ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                        {program.levelLabel}
                      </span>
                    )}
                    <h3 className="mt-3 text-xl font-bold text-gray-900">{program.title}</h3>
                    {program.subtitle && <p className="text-sm font-medium text-gray-500">{program.subtitle}</p>}
                    {program.description && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{program.description}</p>}

                    {features.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {features.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${isYellow ? "text-yellow-500" : "text-blue-600"}`} />
                            <span className="text-xs text-gray-600">{f.title ?? f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {program.linkUrl && (
                      <Link
                        href={program.linkUrl}
                        className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${isYellow ? "text-yellow-600 hover:text-yellow-700" : "text-blue-600 hover:text-blue-700"}`}
                      >
                        Pelajari lebih lanjut <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar: USP + CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl bg-blue-900 p-8 text-white sm:flex-row">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {["Guru Profesional", "Kurikulum Terstruktur", "Hasil Terbukti"].map((usp) => (
              <div key={usp} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-semibold">{usp}</span>
              </div>
            ))}
          </div>
          <Link
            href="/daftar"
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 transition-colors hover:bg-yellow-300"
          >
            <Phone className="h-4 w-4" /> KONSULTASI GRATIS
          </Link>
        </div>
      </div>
    </section>
  );
}
