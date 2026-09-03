import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hasil Event" };

export default async function EventResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  });
  if (!event) redirect("/events");

  const session = await auth();

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id, score: { not: null } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ rank: "asc" }, { score: "desc" }],
  });

  const myReg = session?.user
    ? registrations.find((r) => r.user.id === session.user.id)
    : null;

  const podiumColors = ["text-yellow-500", "text-gray-500", "text-amber-600"];
  const podiumBgs = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-amber-50 border-amber-200"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 py-10 text-white">
        <div className="max-w-3xl mx-auto px-4">
          <Link href={`/events/${id}`} className="flex items-center gap-1 text-blue-100 text-sm mb-4 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Event
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-300" />
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-blue-100 text-sm">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {registrations.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Belum ada hasil ujian.</div>
        ) : (
          <>
            {registrations.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map((i) => {
                  const r = registrations[i];
                  if (!r) return <div key={i} />;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 text-center ${podiumBgs[i]} ${i === 0 ? "mt-4" : i === 1 ? "mt-0" : "mt-8"}`}
                    >
                      <Medal className={`h-7 w-7 mx-auto mb-1 ${podiumColors[i]}`} />
                      <p className={`text-2xl font-bold ${podiumColors[i]}`}>#{r.rank}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.user.name}</p>
                      <p className="text-lg font-bold text-gray-700">{r.score}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {myReg && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500 font-medium">Posisi Anda</p>
                  <p className="font-semibold text-gray-900">{myReg.user.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">#{myReg.rank}</p>
                  <p className="text-sm text-gray-600">Skor: {myReg.score}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium w-12">Rank</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Peserta</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 last:border-0 ${r.user.id === session?.user?.id ? "bg-blue-50" : idx % 2 === 0 ? "" : "bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-700">
                        {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{r.user.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
