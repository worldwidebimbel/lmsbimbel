import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { clearOAuth2Cache } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const clientId = (body.clientId ?? "").trim();
  const clientSecret = (body.clientSecret ?? "").trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Client ID dan Client Secret wajib diisi" },
      { status: 400 }
    );
  }

  await db.appSetting.upsert({
    where: { key: "gmail_client_id" },
    create: { key: "gmail_client_id", value: clientId },
    update: { value: clientId },
  });
  await db.appSetting.upsert({
    where: { key: "gmail_client_secret" },
    create: { key: "gmail_client_secret", value: clientSecret },
    update: { value: clientSecret },
  });

  clearOAuth2Cache();
  await logAudit({ entity: "AppSetting", entityId: "gmail-oauth-credentials", action: "UPDATE" });
  return NextResponse.json({ ok: true });
}
