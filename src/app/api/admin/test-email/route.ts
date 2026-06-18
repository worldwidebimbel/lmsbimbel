import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { to } = await req.json();
  if (!to) return NextResponse.json({ error: "Email tujuan wajib diisi" }, { status: 400 });

  try {
    await sendEmail({
      to,
      subject: "Test Email dari EduBimbel LMS",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#3B82F6">✅ Test Email Berhasil</h2>
          <p>Email ini dikirim sebagai test konfigurasi SMTP dari <strong>EduBimbel LMS</strong>.</p>
          <p style="color:#6b7280;font-size:12px">Dikirim oleh: ${session.user.name ?? session.user.email}</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
