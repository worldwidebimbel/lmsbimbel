import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAI } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import {
  resolveProviderConfig,
  resolveImageProviderConfig,
  resolveTTSProviderConfig,
  resolveVideoProviderConfig,
  type AIProviderId,
} from "@/lib/ai-providers";
import { runVideoPipeline, MAX_SCENES, type VideoJobRequest } from "@/lib/ai-video-pipeline";
import { runDirectVideoPipeline, type DirectVideoJobRequest } from "@/lib/ai-video-direct";

// ============================================================
// AI Builder — Fase 4: Video Audio-Visual
// Dua mode (future-commit.md §4.4):
// - composite (hemat): naskah → gambar → TTS → FFmpeg → MP4
// - direct (premium): OpenRouter async video API (Veo/Hailuo/Wan)
//
// POST → buat AiGenerationJob (PENDING) → eksekusi async
// (fire-and-forget — cocok untuk deploy VPS + PM2 long-running).
// Progress dipolling lewat GET /api/ai/jobs/[id].
//
// Guardrails (future-commit.md):
// - jumlah scene ≤ 12 (dipaksa 3..12, composite)
// - durasi total ≤ 5 menit (divalidasi di pipeline setelah naskah)
// - satu job video aktif per user
// ============================================================

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "VIDEO");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();
  const {
    mode: bodyMode,
    topic,
    subjectName,
    jenjang,
    sceneCount,
    voice,
    textProvider,
    textModel,
    imageProvider,
    imageModel,
    ttsProvider,
    ttsModel,
    // Direct mode params
    durationSec,
    resolution,
    aspectRatio,
    videoProvider,
    videoModel,
    retryJobId,
  } = body as {
    mode?: string;
    topic?: string;
    subjectName?: string;
    jenjang?: string;
    sceneCount?: number;
    voice?: string;
    textProvider?: string;
    textModel?: string;
    imageProvider?: string;
    imageModel?: string;
    ttsProvider?: string;
    ttsModel?: string;
    durationSec?: number;
    resolution?: string;
    aspectRatio?: string;
    videoProvider?: string;
    videoModel?: string;
    retryJobId?: string;
  };

  const mode = bodyMode === "direct" || bodyMode === "composite" ? bodyMode : settings.videoMode;

  // Guardrail: satu job video aktif per user
  const active = await db.aiGenerationJob.findFirst({
    where: { createdBy: session.userId, capability: "VIDEO", status: { in: ["PENDING", "PROCESSING"] } },
    select: { id: true },
  });
  if (active) {
    return NextResponse.json(
      { error: "Anda masih punya job video yang berjalan. Tunggu sampai selesai.", jobId: active.id },
      { status: 409 }
    );
  }

  // ---------- Retry: ambil request dari job lama, dispatch sesuai mode ----------
  if (retryJobId) {
    const old = await db.aiGenerationJob.findFirst({
      where: { id: retryJobId, createdBy: session.userId, capability: "VIDEO", status: "FAILED" },
      select: { params: true },
    });
    const oldParams = old?.params as { request?: unknown; mode?: string } | null;
    const oldMode = oldParams?.mode === "direct" ? "direct" : "composite";

    if (oldMode === "direct") {
      const oldReq = oldParams?.request as DirectVideoJobRequest | undefined;
      if (!oldReq) {
        return NextResponse.json({ error: "Job tidak ditemukan atau tidak bisa di-retry." }, { status: 404 });
      }
      const job = await db.aiGenerationJob.create({
        data: {
          capability: "VIDEO",
          status: "PENDING",
          provider: oldReq.videoProvider ?? "openrouter",
          model: oldReq.videoModel ?? "direct",
          params: { request: oldReq, mode: "direct", progress: { stage: "queued", current: 0, total: 0, mode: "direct" } } as never,
          createdBy: session.userId,
        },
      });
      runDirectVideoPipeline(job.id, oldReq, session.userId).catch((e) => console.error("[AI video direct] pipeline crashed:", e));
      return NextResponse.json({ jobId: job.id }, { status: 202 });
    }

    const oldReq = oldParams?.request as VideoJobRequest | undefined;
    if (!oldReq) {
      return NextResponse.json({ error: "Job tidak ditemukan atau tidak bisa di-retry." }, { status: 404 });
    }
    const job = await db.aiGenerationJob.create({
      data: {
        capability: "VIDEO",
        status: "PENDING",
        provider: "composite",
        model: "pipeline",
        params: { request: oldReq, mode: "composite", progress: { stage: "queued", current: 0, total: 0, mode: "composite" } } as never,
        createdBy: session.userId,
      },
    });
    runVideoPipeline(job.id, oldReq, session.userId).catch((e) => console.error("[AI video] pipeline crashed:", e));
    return NextResponse.json({ jobId: job.id }, { status: 202 });
  }

  // ---------- Request baru ----------
  if (!topic?.trim()) {
    return NextResponse.json({ error: "Topik wajib diisi" }, { status: 400 });
  }

  // ---------- Mode direct (premium — OpenRouter video API) ----------
  if (mode === "direct") {
    const videoCfg = resolveVideoProviderConfig(videoProvider ?? "openrouter");
    if (!videoCfg.apiKey) {
      return NextResponse.json({ error: `Provider video belum dikonfigurasi (${videoCfg.keyEnvName}).` }, { status: 503 });
    }
    const textCfg = resolveProviderConfig((textProvider ?? "apiclaude") as AIProviderId);
    if (!textCfg.apiKey) {
      return NextResponse.json({ error: `Provider teks belum dikonfigurasi (${textCfg.keyEnvName}).` }, { status: 503 });
    }

    const request: DirectVideoJobRequest = {
      topic: topic.trim(),
      subjectName,
      jenjang,
      durationSec: durationSec ? Math.min(10, Math.max(2, Number(durationSec))) : undefined,
      resolution: resolution || "720p",
      aspectRatio: aspectRatio || "16:9",
      videoProvider: videoProvider ?? "openrouter",
      videoModel,
      textProvider,
      textModel,
    };

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "VIDEO",
        status: "PENDING",
        provider: request.videoProvider!,
        model: videoModel || "direct",
        params: { request, mode: "direct", progress: { stage: "queued", current: 0, total: 0, mode: "direct" } } as never,
        createdBy: session.userId,
      },
    });

    runDirectVideoPipeline(job.id, request, session.userId).catch((e) => console.error("[AI video direct] pipeline crashed:", e));
    return NextResponse.json({ jobId: job.id, mode: "direct" }, { status: 202 });
  }

  // ---------- Mode composite (hemat — pipeline FFmpeg) ----------
  const numScenes = Math.min(MAX_SCENES, Math.max(3, Number(sceneCount) || 5));

  const textId = (textProvider ?? "apiclaude") as AIProviderId;
  const imageId = imageProvider ?? "openai";
  const ttsId = ttsProvider ?? "openai";

  // Cek konfigurasi ketiga provider sebelum mulai job
  const textCfg = resolveProviderConfig(textId);
  const imageCfg = resolveImageProviderConfig(imageId);
  const ttsCfg = resolveTTSProviderConfig(ttsId);
  if (!textCfg.apiKey) {
    return NextResponse.json({ error: `Provider teks belum dikonfigurasi (${textCfg.keyEnvName}).` }, { status: 503 });
  }
  if (!imageCfg.apiKey) {
    return NextResponse.json({ error: `Provider gambar belum dikonfigurasi (${imageCfg.keyEnvName}).` }, { status: 503 });
  }
  if (!ttsCfg.apiKey) {
    return NextResponse.json({ error: `Provider TTS belum dikonfigurasi (${ttsCfg.keyEnvName}).` }, { status: 503 });
  }

  const request: VideoJobRequest = {
    topic: topic.trim(),
    subjectName,
    jenjang,
    sceneCount: numScenes,
    voice,
    textProvider: textId,
    textModel,
    imageProvider: imageId,
    imageModel,
    ttsProvider: ttsId,
    ttsModel,
  };

  const job = await db.aiGenerationJob.create({
    data: {
      capability: "VIDEO",
      status: "PENDING",
      provider: "composite",
      model: "pipeline",
      params: { request, mode: "composite", progress: { stage: "queued", current: 0, total: 0, mode: "composite" } } as never,
      createdBy: session.userId,
    },
  });

  // Fire-and-forget — progress lewat polling /api/ai/jobs/[id]
  runVideoPipeline(job.id, request, session.userId).catch((e) => console.error("[AI video] pipeline crashed:", e));

  return NextResponse.json({ jobId: job.id, mode: "composite" }, { status: 202 });
}
