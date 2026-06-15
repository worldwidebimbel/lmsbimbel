import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleFeature } from "@/lib/feature-flags";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await params;
    const { isActive } = await req.json();
    const updated = await toggleFeature(code, isActive, session.user.id as string);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 });
  }
}
