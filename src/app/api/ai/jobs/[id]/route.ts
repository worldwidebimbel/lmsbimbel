import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ============================================================
// AI Builder — polling status satu job (dipakai UI video Fase 4
// untuk progress per tahap + retry on FAILED).
// Hanya pemilik job yang boleh melihat.
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const job = await db.aiGenerationJob.findFirst({
    where: { id, createdBy: session.user.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      capability: job.capability,
      status: job.status,
      params: job.params,
      resultUrl: job.resultUrl,
      resultMaterialId: job.resultMaterialId,
      errorMessage: job.errorMessage,
      durationMs: job.durationMs,
      createdAt: job.createdAt,
    },
  });
}
