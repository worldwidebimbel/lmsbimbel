import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-policy";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const limited = RATE_LIMITS.register(req);
  if (limited) return limited;

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    const { valid: pwValid, errors: pwErrors } = validatePassword(password);
    if (!pwValid) {
      return NextResponse.json({ error: pwErrors.join(", ") }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: "SISWA",
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await logAudit({ entity: "User", entityId: user.id, action: "CREATE", after: { name: user.name, email: user.email, role: user.role, source: "public-register" } });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat registrasi" }, { status: 500 });
  }
}
