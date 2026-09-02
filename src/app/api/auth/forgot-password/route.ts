import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { sendInAppNotification } from "@/lib/notification-helper";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const limited = RATE_LIMITS.publicForm(req);
  if (limited) return limited;

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const resetToken = await db.passwordResetToken.create({
      data: { email: email.toLowerCase().trim(), token, expiresAt },
    });

    await logAudit({ entity: "PasswordResetToken", entityId: resetToken.id, action: "CREATE", after: { email: email.toLowerCase().trim(), expiresAt, via: "forgot-password" } });

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendInAppNotification(
      user.id,
      "Reset Password",
      `Permintaan reset password diterima. Klik link berikut untuk reset: ${resetUrl}`,
      resetUrl,
    );

    console.log(`[forgot-password] Reset link for ${email}: ${resetUrl}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
