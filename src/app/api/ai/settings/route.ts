import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAISettings, getProviderStatus, updateAISettings } from "@/lib/ai-settings";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function requireSuperAdmin() {
  const session = await auth();
  return session?.user?.role === "SUPER_ADMIN" ? session : null;
}

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getAISettings();
  return NextResponse.json({ settings, providers: getProviderStatus() });
}

export async function PATCH(req: NextRequest) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  await updateAISettings(body as Record<string, string>);
  await logAudit({
    entity: "AppSetting",
    entityId: "ai-builder",
    action: "UPDATE",
    after: { keys: Object.keys(body as Record<string, string>) },
  });

  const settings = await getAISettings();
  return NextResponse.json({ settings, providers: getProviderStatus() });
}
