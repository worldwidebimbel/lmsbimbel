import { NextResponse } from "next/server";
import { getAllFeatureFlags } from "@/lib/feature-flags";

export async function GET() {
  try {
    const flags = await getAllFeatureFlags();
    return NextResponse.json(flags);
  } catch {
    return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
  }
}
