import { db } from "@/lib/db";
import type { Metadata } from "next";
import { MapPin, Phone, Clock } from "lucide-react";
import PublicShell from "@/components/landing/PublicShell";

export const metadata: Metadata = {
  title: "Cabang & Lokasi",
  description: "Temukan cabang bimbingan belajar terdekat di kota Anda.",
};

export const dynamic = "force-dynamic";

export default async function CabangPage() {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    orderBy: [{ name: "asc" }],
  });

  return (
    <PublicShell>
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <MapPin className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cabang & Lokasi</h1>
          <p className="mt-2 text-gray-500">{branches.length} cabang tersedia</p>
        </div>

        {branches.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada data cabang.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900">{b.name}</h3>
                {b.address && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                    {b.address}
                  </p>
                )}
                {b.phone && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                    {b.phone}
                  </p>
                )}
                {b.email && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                    {b.email}
                  </p>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
