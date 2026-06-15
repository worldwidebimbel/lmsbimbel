import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: materialId } = await params;
  const { isCompleted = false } = await req.json().catch(() => ({}));

  const progress = await db.materialProgress.upsert({
    where: { materialId_studentId: { materialId, studentId: session.user.id } },
    update: {
      lastViewedAt: new Date(),
      ...(isCompleted && { isCompleted: true, completedAt: new Date() }),
    },
    create: {
      materialId,
      studentId: session.user.id,
      lastViewedAt: new Date(),
      isCompleted,
      ...(isCompleted && { completedAt: new Date() }),
    },
  });

  return NextResponse.json(progress);
}
