import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createEventPayment } from "@/lib/event-payment";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");
  const packageId = body.packageId ? String(body.packageId) : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id, status: { in: ["PUBLISHED", "ONGOING"] } },
    include: { packages: true },
  });
  if (!event) return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });

  if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
    return NextResponse.json({ error: "Pendaftaran sudah ditutup" }, { status: 400 });
  }

  const participants = await db.eventRegistration.count({ where: { eventId: id } });
  if (event.maxParticipants !== null && participants >= event.maxParticipants) {
    return NextResponse.json({ error: "Kuota penuh" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Email sudah terdaftar. Silakan login terlebih dahulu." },
      { status: 409 }
    );
  }

  const selectedPackage = packageId ? event.packages.find((p) => p.id === packageId) : null;
  if (event.isPaid && event.packages.length > 0 && !selectedPackage) {
    return NextResponse.json({ error: "Pilih paket event" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "SISWA",
      isActive: true,
      defaultBranchId: event.branchId,
      profile: { create: { phone: phone || "" } },
    },
  });

  const price = selectedPackage?.price ?? 0;
  const registration = await db.eventRegistration.create({
    data: {
      eventId: id,
      userId: user.id,
      packageId: selectedPackage?.id || null,
      status: "PENDING",
      paymentStatus: event.isPaid ? "PENDING" : "FREE",
      price,
    },
  });
  await logAudit({ entity: "User", entityId: user.id, action: "CREATE", after: { name, email, role: "SISWA", eventId: id } });
  await logAudit({ entity: "EventRegistration", entityId: registration.id, action: "CREATE", after: { eventId: id, userId: user.id, packageId: selectedPackage?.id || null, status: registration.status, paymentStatus: registration.paymentStatus, price } });

  if (event.isPaid && price > 0) {
    const redirectUrl = await createEventPayment(registration.id, id, user.id);
    if (!redirectUrl) {
      return NextResponse.json({ error: "Gagal membuat pembayaran" }, { status: 502 });
    }
    return NextResponse.json({ success: true, email, redirectUrl });
  }

  return NextResponse.json({ success: true, email });
}
