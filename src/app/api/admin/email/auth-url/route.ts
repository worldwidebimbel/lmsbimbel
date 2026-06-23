import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET belum diset di .env.local" },
      { status: 503 }
    );
  }

  const callbackUri = `${(process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/["\']/g, "").replace(/\/$/, "")}/api/admin/email/callback`;
  const mailer = new GmailOAuth2(clientId, clientSecret, callbackUri);
  return NextResponse.json({ url: mailer.getAuthUrl(), callbackUri });
}
