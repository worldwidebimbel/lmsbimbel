import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (!["SISWA", "ORANG_TUA", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await db.event.findUnique({
    where: { id, status: { in: ["PUBLISHED", "ONGOING"] } },
    include: { packages: true },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });

  const body = await req.json();
  const { packageId } = body;

  const selectedPackage = packageId ? event.packages.find((p) => p.id === packageId) : null;

  const existing = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Anda sudah terdaftar di event ini" }, { status: 409 });
  }

  const price = selectedPackage?.price ?? 0;

  const registration = await db.eventRegistration.create({
    data: {
      eventId: id,
      userId: session.user.id,
      packageId: selectedPackage?.id || null,
      status: "PENDING",
      paymentStatus: event.isPaid ? "PENDING" : "FREE",
      price,
    },
  });

  await logAudit({ entity: "EventRegistration", entityId: registration.id, action: "CREATE", after: { eventId: id, packageId: selectedPackage?.id || null, status: registration.status, paymentStatus: registration.paymentStatus, price } });

  return NextResponse.json({ success: true, registration }, { status: 201 });
}
