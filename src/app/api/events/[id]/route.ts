import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id, status: { in: ["PUBLISHED", "ONGOING"] } },
    include: {
      branch: { select: { name: true, code: true } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}
