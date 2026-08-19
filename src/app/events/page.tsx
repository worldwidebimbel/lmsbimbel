import { db } from "@/lib/db";
import { Calendar, MapPin, Users, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import PublicShell from "@/components/landing/PublicShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Event & Tryout" };

export default async function PublicEventsPage() {
  const events = await db.event.findMany({
    where: { status: { in: ["PUBLISHED", "ONGOING"] } },
    include: {
      branch: { select: { name: true, code: true } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-16 text-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Event, Tryout & Olimpiade</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">Ikuti berbagai event berkualitas untuk meningkatkan prestasi belajar Anda.</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {events.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada event yang tersedia saat ini.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {event.image ? (
                    <div className="relative h-40 bg-gray-100">
                      <Image src={event.image} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    </div>
                  ) : (
                    <div className="h-40 bg-blue-100 flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-blue-400" />
                    </div>
                  )}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{event.type}</span>
                      <span className="text-xs text-gray-500">{event.branch?.name}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    {event.description && <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>}

                    <div className="space-y-1.5 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(event.startDate).toLocaleString("id-ID")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" /> {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {event._count.registrations} pendaftar
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">
                        {event.isPaid ? (
                          event.packages.length > 0 ? (
                            <span>Mulai {formatCurrency(Math.min(...event.packages.map((p) => p.price)))}</span>
                          ) : (
                            <span>Berbayar</span>
                          )
                        ) : (
                          <span className="text-green-600">Gratis</span>
                        )}
                      </div>
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Detail <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
