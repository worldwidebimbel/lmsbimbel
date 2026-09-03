import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { GmailOAuth2 } from "@/lib/gmail-oauth2";
import { getGmailOAuthCredentials } from "@/lib/email";

function strip(v?: string) {
  return (v ?? "").replace(/^["']|["']$/g, "").trim();
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const creds = await getGmailOAuthCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "Client ID dan Client Secret belum diset. Masukkan kredensial di form Gmail OAuth2 di bawah." },
      { status: 503 }
    );
  }

  const callbackUri = `${strip(process.env.NEXTAUTH_URL).replace(/\/$/, "") || "http://localhost:3000"}/api/admin/email/callback`;
  const state = randomUUID();
  const mailer = new GmailOAuth2(creds.clientId, creds.clientSecret, callbackUri);
  const res = NextResponse.json({
    url: mailer.getAuthUrl(state),
    callbackUri,
    credSource: creds.source,
    clientIdPreview: creds.clientId.slice(0, 24),
  });
  res.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/admin/email/callback",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
