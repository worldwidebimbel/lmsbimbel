import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

const CERT_KEYS = [
  "cert_org_name",
  "cert_title_prefix",
  "cert_subtitle",
  "cert_signature_name",
  "cert_signature_title",
  "cert_logo_url",
  "cert_bg_url",
];

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await db.siteConfig.findMany({ where: { key: { in: CERT_KEYS } } });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  for (const key of CERT_KEYS) {
    if (body[key] === undefined) continue;
    await db.siteConfig.upsert({
      where: { key },
      update: { value: String(body[key]) },
      create: { key, value: String(body[key]) },
    });
  }

  await logAudit({ entity: "SiteConfig", entityId: "cert-template", action: "UPDATE" });
  return NextResponse.json({ success: true });
}
