import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { clearPaymentGatewayCache } from "@/lib/payment-gateway";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.appSetting.findMany({
    where: {
      key: {
        in: ["duitku_merchant_code", "duitku_api_key", "duitku_sandbox", "payment_gateway_enabled", "manual_payment_instructions"],
      },
    },
  });
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;

  return NextResponse.json({
    merchantCode: settings.duitku_merchant_code ?? "",
    apiKey: settings.duitku_api_key ? "••••••••" : "",
    sandbox: settings.duitku_sandbox !== "false",
    gatewayEnabled: settings.payment_gateway_enabled === "true",
    manualPaymentInstructions: settings.manual_payment_instructions ?? "",
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, string> = {};

  if (typeof body.merchantCode === "string") {
    updates.duitku_merchant_code = body.merchantCode.trim();
  }
  if (typeof body.apiKey === "string" && body.apiKey !== "••••••••") {
    updates.duitku_api_key = body.apiKey.trim();
  }
  if (typeof body.sandbox === "boolean") {
    updates.duitku_sandbox = body.sandbox ? "true" : "false";
  }
  if (typeof body.gatewayEnabled === "boolean") {
    updates.payment_gateway_enabled = body.gatewayEnabled ? "true" : "false";
  }
  if (typeof body.manualPaymentInstructions === "string") {
    updates.manual_payment_instructions = body.manualPaymentInstructions;
  }

  for (const [key, value] of Object.entries(updates)) {
    await db.appSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  clearPaymentGatewayCache();
  await logAudit({ entity: "AppSetting", entityId: "payment-gateway", action: "UPDATE", after: { keys: Object.keys(updates) } });
  return NextResponse.json({ ok: true });
}
