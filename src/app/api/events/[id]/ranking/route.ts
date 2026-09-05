import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { calculateEventRanking } from "@/lib/event-ranking";
import { upsertEventCertificate } from "@/lib/certificate";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rankings = await calculateEventRanking(id);
  return NextResponse.json(rankings);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });

  const rankings = await calculateEventRanking(id);
  const winners = rankings.slice(0, 3);

  // Persist rank & score ke registrations (dipakai issueAll & UI sertifikat)
  for (const entry of rankings) {
    await db.eventRegistration.updateMany({
      where: { eventId: id, userId: entry.userId },
      data: { rank: entry.rank, score: entry.score },
    });
  }

  // Terbitkan / sinkronkan sertifikat juara (idempoten per user per event)
  let certificatesCreated = 0;
  let certificatesUpdated = 0;
  for (const winner of winners) {
    const res = await upsertEventCertificate({
      eventId: id,
      eventName: event.title,
      userId: winner.userId,
      userName: winner.userName,
      rank: winner.rank,
      score: winner.score,
    });
    if (res.action === "created") certificatesCreated++;
    else if (res.action === "updated") certificatesUpdated++;
  }

  await logAudit({
    action: "RANKING_CALCULATE",
    entity: "Event",
    entityId: id,
    after: {
      rankedCount: rankings.length,
      winnersCount: winners.length,
      certificatesCreated,
      certificatesUpdated,
    },
  });

  return NextResponse.json({
    rankings,
    winners,
    certificatesCreated,
    certificatesUpdated,
  });
}
