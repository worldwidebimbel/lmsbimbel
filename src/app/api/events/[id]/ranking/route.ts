import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { calculateEventRanking } from "@/lib/event-ranking";
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
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const rankings = await calculateEventRanking(id);
  const winners = rankings.slice(0, 3);

  for (const winner of winners) {
    const existing = await db.certificate.findFirst({
      where: { userId: winner.userId, type: "EVENT_WINNER" },
    });

    if (!existing) {
      await db.certificate.create({
        data: {
          userId: winner.userId,
          type: "EVENT_WINNER",
          title: `Juara ${winner.rank} Event`,
          code: `EVT-${id.slice(-6)}-${winner.rank}`,
          certificateNo: `EVT-${id.slice(-6)}-${winner.rank}`,
          recipientName: winner.userName,
          eventId: id,
          rank: winner.rank,
          score: winner.score,
        },
      });
    }
  }

  await logAudit({
    action: "RANKING_CALCULATE",
    entity: "Event",
    entityId: id,
    after: { winnersCount: winners.length },
  });

  return NextResponse.json({ rankings, winners, certificatesGenerated: winners.length });
}
