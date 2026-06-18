import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULT_SETTINGS: Record<string, string> = {
  app_name: "EduBimbel LMS",
  app_tagline: "Platform Bimbel Modern & Terpadu",
  contact_email: "",
  contact_phone: "",
  address: "",
  whatsapp_admin: "",
  qris_image_url: "",
  qris_bank_name: "",
  qris_account_name: "",
  qris_account_number: "",
};

function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.appSetting.findMany();
  const settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, string>;
  const allowedKeys = Object.keys(DEFAULT_SETTINGS);

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;
    await db.appSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  return NextResponse.json({ success: true });
}
