import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const body = await req.json().catch(() => ({}));
  const { registrationIds, issueAll } = body as { registrationIds?: string[]; issueAll?: boolean };

  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, title: true } });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });

  const where = issueAll
    ? { eventId, status: { in: ["ATTENDED", "PAID", "CONFIRMED"] as never[] } }
    : { id: { in: registrationIds ?? [] }, eventId };

  const registrations = await db.eventRegistration.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
  });

  let issued = 0;
  let skipped = 0;

  for (const reg of registrations) {
    const type = reg.rank != null && reg.rank <= 3 ? "EVENT_WINNER" : "EVENT_PARTICIPATION";
    const existing = await db.certificate.findFirst({
      where: { userId: reg.user.id, eventId },
    });
    if (existing) { skipped++; continue; }

    await db.certificate.create({
      data: {
        code: randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase(),
        userId: reg.user.id,
        type,
        title: type === "EVENT_WINNER"
          ? `Sertifikat Juara — ${event.title}`
          : `Sertifikat Peserta — ${event.title}`,
        recipientName: reg.user.name,
        eventId,
        eventName: event.title,
        score: reg.score,
        rank: reg.rank,
      },
    });
    issued++;
  }

  return NextResponse.json({ issued, skipped, total: registrations.length });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: eventId } = await params;
  const certs = await db.certificate.findMany({
    where: { eventId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(certs);
}
