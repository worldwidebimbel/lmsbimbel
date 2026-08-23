import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, Clock, Users, MapPin } from "lucide-react";
import type { Metadata } from "next";
import PublicShell from "@/components/landing/PublicShell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await db.program.findUnique({ where: { slug, isActive: true } });
  if (!program) return { title: "Program tidak ditemukan" };

  return {
    title: program.name,
    description: program.description ?? "",
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await db.program.findUnique({
    where: { slug, isActive: true },
    include: {
      branches: { select: { id: true, name: true, address: true } },
      levels: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });

  if (!program) notFound();

  const benefits = (program.benefits as string[]) ?? [];
  const hasPromo = program.promoPrice && program.promoUntil && new Date() < program.promoUntil;
  const displayPrice = hasPromo ? program.promoPrice! : program.price;

  return (
    <PublicShell>
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{program.name}</h1>
          {program.description && (
            <p className="mt-4 text-gray-600 whitespace-pre-wrap">{program.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {program.targetAudience && (
            <div className="rounded-xl border border-gray-200 p-4">
              <Users className="h-5 w-5 text-indigo-600 mb-2" />
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-sm font-medium text-gray-900">{program.targetAudience}</p>
            </div>
          )}
          {program.duration && (
            <div className="rounded-xl border border-gray-200 p-4">
              <Clock className="h-5 w-5 text-indigo-600 mb-2" />
              <p className="text-xs text-gray-500">Durasi</p>
              <p className="text-sm font-medium text-gray-900">{program.duration}</p>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Harga</p>
            <p className="text-lg font-bold text-indigo-600">
              {displayPrice > 0 ? `Rp ${displayPrice.toLocaleString("id-ID")}` : "Gratis"}
            </p>
            {hasPromo && (
              <p className="text-xs text-gray-400 line-through">Rp {program.price.toLocaleString("id-ID")}</p>
            )}
          </div>
        </div>

        {benefits.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Keunggulan Program</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {program.materials && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Materi Pembelajaran</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{program.materials}</p>
          </div>
        )}

        {program.levels.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Jenjang</h2>
            <div className="flex flex-wrap gap-2">
              {program.levels.map((l) => (
                <span key={l.id} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700">{l.name}</span>
              ))}
            </div>
          </div>
        )}

        {program.branches.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Tersedia di Cabang</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {program.branches.map((b) => (
                <div key={b.id} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    {b.address && <p className="text-xs text-gray-500">{b.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          <div className="rounded-xl bg-indigo-600 text-white p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Tertarik dengan program ini?</h3>
            <p className="text-white/90 mb-4">Daftar sekarang dan mulai perjalanan belajar Anda</p>
            <Link
              href="/ppdb"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              Daftar Sekarang <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
