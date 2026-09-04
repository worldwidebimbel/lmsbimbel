import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { getBranchQrisKey } from "@/lib/qris-settings";
import { logAudit } from "@/lib/audit";

const DEFAULT_SETTINGS: Record<string, string> = {
  app_name: "EduBimbel LMS",
  app_tagline: "Platform Bimbel Modern & Terpadu",
  contact_email: "",
  contact_phone: "",
  address: "",
  whatsapp_admin: "",
  disable_login_info: "false",
  qris_image_url: "",
  qris_bank_name: "",
  qris_account_name: "",
  qris_account_number: "",
};

const QRIS_KEYS = ["qris_image_url", "qris_bank_name", "qris_account_name", "qris_account_number"];

function isAdmin(role: string) {
  return isAdminRole(role);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const requestedBranchId = req.nextUrl.searchParams.get("branchId") || branchId;
  if (requestedBranchId && !isSuperAdmin && requestedBranchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.appSetting.findMany();
  const settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) settings[r.key] = r.value;

  if (requestedBranchId) {
    for (const key of QRIS_KEYS) {
      const branchValue = settings[getBranchQrisKey(key, requestedBranchId)];
      if (branchValue !== undefined) settings[key] = branchValue;
    }
  }

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { isSuperAdmin, branchId } = await getBranchScope();
  const body = (await req.json()) as Record<string, string>;
  const allowedKeys = Object.keys(DEFAULT_SETTINGS);
  const targetBranchId = body.branchId || branchId;
  if (targetBranchId && !isSuperAdmin && targetBranchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;
    const isQris = QRIS_KEYS.includes(key);
    const dbKey = isQris && targetBranchId ? getBranchQrisKey(key, targetBranchId) : key;
    await db.appSetting.upsert({
      where: { key: dbKey },
      update: { value: String(value) },
      create: { key: dbKey, value: String(value) },
    });
  }

  await logAudit({ entity: "AppSetting", entityId: targetBranchId ?? "global", action: "UPDATE" });
  return NextResponse.json({ success: true });
}
