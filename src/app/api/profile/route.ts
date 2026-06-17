import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true,
      profile: { select: { phone: true, address: true } },
    },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, address, currentPassword, newPassword } = body;

  const updateData: Record<string, unknown> = {};
  if (name?.trim()) updateData.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Password lama wajib diisi" }, { status: 400 });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!user?.password) return NextResponse.json({ error: "Akun tidak menggunakan password" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  if (phone !== undefined || address !== undefined) {
    await db.userProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, phone: phone || null, address: address || null },
      update: { phone: phone || null, address: address || null },
    });
  }

  const hasUserChanges = Object.keys(updateData).length > 0;
  if (!hasUserChanges && phone === undefined && address === undefined && !newPassword) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
  }

  let updated;
  if (hasUserChanges) {
    updated = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, profile: { select: { phone: true, address: true } } },
    });
  } else {
    updated = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, profile: { select: { phone: true, address: true } } },
    });
  }
  return NextResponse.json(updated);
}
