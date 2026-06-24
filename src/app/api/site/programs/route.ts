import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const programs = await db.siteProgram.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(programs);
}
