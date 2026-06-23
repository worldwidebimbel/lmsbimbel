import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const strip = (v?: string) => (v ?? "").replace(/^["']|["']$/g, "").trim();
  const clientId     = strip(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = strip(process.env.GOOGLE_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum diset di .env.local" },
      { status: 503 }
    );
  }

  const callbackUri = `${strip(process.env.NEXTAUTH_URL).replace(/\/$/, "") || "http://localhost:3000"}/api/admin/email/callback`;
  const mailer = new GmailOAuth2(clientId, clientSecret, callbackUri);
  return NextResponse.json({ url: mailer.getAuthUrl(), callbackUri });
}
