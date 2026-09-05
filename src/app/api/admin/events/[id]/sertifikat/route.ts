import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertEventCertificate } from "@/lib/certificate";
import { logAudit } from "@/lib/audit";
import { getBranchScope, assertBranchAccess } from "@/lib/branch-context";

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

  const scope = await getBranchScope();
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, title: true, branchId: true } });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  if (!assertBranchAccess(event.branchId, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Prisma.EventRegistrationWhereInput = issueAll
    ? { eventId, status: { in: ["ATTENDED", "CONFIRMED"] } }
    : { id: { in: registrationIds ?? [] }, eventId };

  const registrations = await db.eventRegistration.findMany({
    where,
    include: { user: { select: { id: true, name: true } } },
  });

  let issued = 0;
  let skipped = 0;
  let updated = 0;

  for (const reg of registrations) {
    const res = await upsertEventCertificate({
      eventId,
      eventName: event.title,
      userId: reg.user.id,
      userName: reg.user.name,
      rank: reg.rank,
      score: reg.score,
    });
    if (res.action === "created") issued++;
    else if (res.action === "updated") updated++;
    else skipped++;
  }

  await logAudit({ entity: "Certificate", entityId: `event-${eventId}`, action: "CREATE", after: { issued, updated, skipped, total: registrations.length } });
  return NextResponse.json({ issued, updated, skipped, total: registrations.length });
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
  const scope = await getBranchScope();
  const event = await db.event.findUnique({ where: { id: eventId }, select: { branchId: true } });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  if (!assertBranchAccess(event.branchId, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const certs = await db.certificate.findMany({
    where: { eventId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(certs);
}
