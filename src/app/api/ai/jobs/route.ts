import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMonthlyUsageSummary } from "@/lib/ai-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const capability = searchParams.get("capability");
  const status = searchParams.get("status");

  const [jobs, usage] = await Promise.all([
    db.aiGenerationJob.findMany({
      where: {
        createdBy: session.user.id,
        ...(capability ? { capability } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getMonthlyUsageSummary(session.user.id),
  ]);

  return NextResponse.json({ jobs, usage });
}
