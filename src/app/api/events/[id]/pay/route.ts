import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEventPayment } from "@/lib/event-payment";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registration = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });
  if (!registration) return NextResponse.json({ error: "Belum terdaftar" }, { status: 404 });
  if (!registration.price) {
    return NextResponse.json({ error: "Event ini gratis" }, { status: 400 });
  }
  if (registration.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Pembayaran sudah lunas" }, { status: 400 });
  }

  const redirectUrl = await createEventPayment(registration.id, id, session.user.id);
  if (!redirectUrl) {
    return NextResponse.json({ error: "Gateway pembayaran belum dikonfigurasi" }, { status: 503 });
  }

  return NextResponse.json({ provider: registration.paymentMethod || "MIDTRANS", redirectUrl });
}
