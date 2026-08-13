import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";
import { db } from "@/lib/db";

function strip(v?: string) {
  return (v ?? "").replace(/^["']|["']$/g, "").trim();
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.appSetting.findMany({
    where: { key: { in: ["gmail_client_id", "gmail_client_secret"] } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const clientId = map.gmail_client_id || strip(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = map.gmail_client_secret || strip(process.env.GOOGLE_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Client ID dan Client Secret belum diset. Masukkan kredensial di form Gmail OAuth2 di bawah." },
      { status: 503 }
    );
  }

  const callbackUri = `${strip(process.env.NEXTAUTH_URL).replace(/\/$/, "") || "http://localhost:3000"}/api/admin/email/callback`;
  const mailer = new GmailOAuth2(clientId, clientSecret, callbackUri);
  return NextResponse.json({ url: mailer.getAuthUrl(), callbackUri });
}
