import { db } from "@/lib/db";
import type { Metadata } from "next";
import { Image as ImageIcon, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Galeri & Prestasi",
  description: "Galeri kegiatan dan prestasi siswa bimbingan belajar.",
};

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const [galleries, prestasi] = await Promise.all([
    db.siteGallery.findMany({
      where: { isActive: true, category: { not: "PRESTASI" } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
    db.siteGallery.findMany({
      where: { isActive: true, category: "PRESTASI" },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <ImageIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Galeri</h1>
          <p className="mt-2 text-gray-500">Dokumentasi kegiatan & prestasi kami</p>
        </div>

        {prestasi.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Prestasi</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {prestasi.map((g) => (
                <div key={g.id} className="group rounded-xl overflow-hidden border border-gray-200">
                  <div className="aspect-video overflow-hidden">
                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-900">{g.title}</p>
                    {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {galleries.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kegiatan</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleries.map((g) => (
                <div key={g.id} className="group rounded-xl overflow-hidden border border-gray-200">
                  <div className="aspect-video overflow-hidden">
                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-gray-900">{g.title}</p>
                    {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                    <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{g.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {galleries.length === 0 && prestasi.length === 0 && (
          <p className="text-center text-gray-400">Belum ada galeri.</p>
        )}
      </div>
    </div>
  );
}
