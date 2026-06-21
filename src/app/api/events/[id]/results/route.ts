import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id, status: { in: ["ONGOING", "COMPLETED"] } },
    select: { id: true, title: true, status: true },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan atau belum selesai" }, { status: 404 });

  const registrations = await db.eventRegistration.findMany({
    where: { eventId: id, score: { not: null } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ rank: "asc" }, { score: "desc" }],
  });

  return NextResponse.json({
    event,
    leaderboard: registrations.map((r) => ({
      rank: r.rank,
      name: r.user.name,
      score: r.score,
      attended: r.status === "ATTENDED",
    })),
  });
}
