import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_CLICKS_PER_IP_PER_DAY = 20;
const ipClickLog = new Map<string, Map<string, number>>();
const MAX_LOG_KEYS = 1000;

function shouldCountClick(ip: string, affiliateCode: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${affiliateCode}:${today}`;
  if (!ipClickLog.has(key)) {
    // Cleanup old entries periodically
    if (ipClickLog.size > MAX_LOG_KEYS) {
      const oldKeys = [...ipClickLog.keys()].filter((k) => !k.endsWith(today));
      for (const oldKey of oldKeys) ipClickLog.delete(oldKey);
    }
    ipClickLog.set(key, new Map());
  }
  const dayMap = ipClickLog.get(key)!;
  const count = dayMap.get(ip) || 0;
  if (count >= MAX_CLICKS_PER_IP_PER_DAY) return false;
  dayMap.set(ip, count + 1);
  return true;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const affiliate = await db.affiliate.findUnique({
    where: { code: upperCode },
    select: { id: true, isActive: true },
  });

  if (!affiliate || !affiliate.isActive) {
    return NextResponse.redirect(new URL("/daftar", _req.url));
  }

  // Rate limit: only count unique clicks per IP per day
  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const shouldCount = shouldCountClick(ip, upperCode);
  if (shouldCount) {
    await db.affiliate.update({
      where: { id: affiliate.id },
      data: { clickCount: { increment: 1 } },
    });
  }

  const response = NextResponse.redirect(new URL("/daftar", _req.url));

  // Set referral cookie for 30 days
  response.cookies.set("ref", upperCode, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
