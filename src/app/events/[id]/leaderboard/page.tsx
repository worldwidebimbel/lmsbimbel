"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Trophy, Medal, Award, Clock } from "lucide-react";

type RankingEntry = {
  userId: string;
  userName: string;
  score: number;
  duration: number;
  rank: number;
};

export default function EventLeaderboardPage() {
  const params = useParams<{ id: string }>();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    async function fetchRanking() {
      const [rankRes, eventRes] = await Promise.all([
        fetch(`/api/events/${params.id}/ranking`),
        fetch(`/api/events/${params.id}`),
      ]);
      if (rankRes.ok) setRankings(await rankRes.json());
      if (eventRes.ok) {
        const evt = await eventRes.json();
        setEventTitle(evt.title ?? "");
      }
      setLoading(false);
    }
    if (params.id) fetchRanking();
  }, [params.id]);

  if (loading) return <div className="container mx-auto p-6">Memuat leaderboard...</div>;

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 10);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        {eventTitle && <p className="text-lg text-gray-500 mt-1">{eventTitle}</p>}
      </div>

      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {top3.map((entry, idx) => {
            const icon = idx === 0 ? Trophy : idx === 1 ? Medal : Award;
            const color = idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-500" : "text-orange-600";
            const Icon = icon;
            return (
              <div key={entry.userId} className={`bg-white rounded-xl border p-6 flex flex-col items-center ${idx === 0 ? "border-yellow-400 shadow-lg" : "border-gray-200"}`}>
                  <Icon className={`h-12 w-12 ${color} mb-2`} />
                  <p className="text-2xl font-bold">#{entry.rank}</p>
                  <p className="text-sm font-medium text-center mt-1">{entry.userName}</p>
                  <span className="mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">{entry.score} pts</span>
                </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-base mb-4">Top 10</h3>
            <div className="space-y-2">
              {rest.map((entry) => (
                <div key={entry.userId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-500 w-8">#{entry.rank}</span>
                    <span className="font-medium">{entry.userName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{entry.score} pts</span>
                    {entry.duration > 0 && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(entry.duration / 1000)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}

      {rankings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
            Belum ada data ranking untuk event ini.
        </div>
      )}
    </div>
  );
}
