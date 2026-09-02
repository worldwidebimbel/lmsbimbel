import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-policy";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const limited = RATE_LIMITS.publicForm(req);
  if (limited) return limited;

  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token dan password wajib diisi" }, { status: 400 });
    }

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password: hashed } }),
      db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ]);

    await logAudit({ entity: "User", entityId: user.id, action: "UPDATE", after: { passwordChanged: true, via: "reset-token" } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reset-password] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
