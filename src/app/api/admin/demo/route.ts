import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clearDemoData, getDemoStatus, importDemoData, DemoType } from "@/lib/demo-seeder";

function isAdmin(role: string) {
  return ["ADMIN", "SUPER_ADMIN"].includes(role);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const status = await getDemoStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { type } = body as { type: DemoType };

  const validTypes = ["AKADEMIK", "UTBK_SNBT", "KEDINASAN", "BAHASA"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Tipe demo tidak valid" }, { status: 400 });
  }

  try {
    const result = await importDemoData(type);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Gagal import demo: " + message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await clearDemoData();
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Gagal hapus demo: " + message }, { status: 500 });
  }
}
