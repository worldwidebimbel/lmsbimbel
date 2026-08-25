import { db } from "@/lib/db";

type RankingEntry = {
  userId: string;
  userName: string;
  score: number;
  duration: number;
  rank: number;
};

type RankingCriteria = {
  primaryField: "score" | "duration";
  secondaryField?: "score" | "duration";
  sortDir?: "asc" | "desc";
};

export async function calculateEventRanking(eventId: string): Promise<RankingEntry[]> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, rankingCriteria: true, autoRanking: true },
  });

  if (!event) return [];

  const criteria = (event.rankingCriteria as RankingCriteria | null) ?? {
    primaryField: "score",
    secondaryField: "duration",
    sortDir: "desc",
  };

  const registrations = await db.eventRegistration.findMany({
    where: { eventId, status: "CONFIRMED" },
    include: { user: { select: { id: true, name: true } } },
  });

  const entries: { userId: string; userName: string; score: number; duration: number }[] = [];

  for (const reg of registrations) {
    const attempts = await db.examAttempt.findMany({
      where: {
        studentId: reg.userId,
        exam: { eventId },
      },
      select: { score: true, startedAt: true, submittedAt: true },
    });

    const bestScore = attempts.reduce((max, a) => Math.max(max, a.score ?? 0), 0);
    const totalDuration = attempts.reduce((sum, a) => {
      if (a.startedAt && a.submittedAt) {
        return sum + (a.submittedAt.getTime() - a.startedAt.getTime());
      }
      return sum;
    }, 0);

    entries.push({
      userId: reg.userId,
      userName: reg.user.name,
      score: bestScore,
      duration: totalDuration,
    });
  }

  const sortDir = criteria.sortDir ?? "desc";
  entries.sort((a, b) => {
    const primary = criteria.primaryField ?? "score";
    const diff = primary === "score" ? b.score - a.score : a.duration - b.duration;
    if (Math.abs(diff) > 0.01) return sortDir === "desc" ? diff : -diff;

    const secondary = criteria.secondaryField ?? "duration";
    if (secondary === "duration") return a.duration - b.duration;
    return b.score - a.score;
  });

  return entries.map((e, i) => ({
    ...e,
    rank: i + 1,
  }));
}

export async function getTopRankings(eventId: string, limit = 10): Promise<RankingEntry[]> {
  const rankings = await calculateEventRanking(eventId);
  return rankings.slice(0, limit);
}

export async function getWinners(eventId: string): Promise<RankingEntry[]> {
  return getTopRankings(eventId, 3);
}
