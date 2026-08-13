import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { clearOAuth2Cache } from "@/lib/email";

export async function DELETE() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keysToDelete = [
    "gmail_refresh_token",
    "gmail_connected_email",
    "gmail_from",
  ];

  await db.appSetting.deleteMany({
    where: { key: { in: keysToDelete } },
  });

  clearOAuth2Cache();
  return NextResponse.json({ ok: true });
}
