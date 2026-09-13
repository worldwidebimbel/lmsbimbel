import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guardAI, logAIUsage } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import { resolveTTSProviderConfig } from "@/lib/ai-providers";
import { getBranchScope } from "@/lib/branch-context";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateAudio } from "@/lib/ai-tts-providers";

// ============================================================
// AI Builder — Fase 3: Materi Audio (TTS)
// Dua mode (mengikuti pola /api/ai/text & /api/ai/image):
// 1. Generate: { text, voice, speed, provider, model }
//    → TTS → upload Cloudinary ("ai-materials", resource_type "video"
//      karena Cloudinary menggolongkan audio sebagai video)
//    → MediaFile → AiGenerationJob (DONE) → usage log (unit: detik)
//    → { audio: { url, mediaId, publicId, durationSec }, jobId }
// 2. Save: { saveAudio: { url, mediaId, title, durationSec, classId,
//                         subjectId, chapterTitle }, jobId }
//    → Material (type AUDIO, isPublished: false) — guru review dulu
// ============================================================

// Batas panjang teks input (karakter) — mencegah biaya & timeout berlebih.
const MAX_TEXT_CHARS = 4000;

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "AUDIO");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();

  // ---------- Mode 2: simpan sebagai Material AUDIO (draft) ----------
  if (body?.saveAudio) {
    const d = body.saveAudio as {
      url?: string;
      mediaId?: string;
      title?: string;
      durationSec?: number;
      classId?: string | null;
      subjectId?: string | null;
      chapterTitle?: string | null;
      chapterOrder?: number;
    };
    if (!d.url || !d.title?.trim()) {
      return NextResponse.json({ error: "url dan title wajib diisi" }, { status: 400 });
    }

    const { isSuperAdmin, branchId } = await getBranchScope();
    if (d.classId && !isSuperAdmin) {
      const cls = await db.class.findUnique({ where: { id: d.classId }, select: { branchId: true } });
      if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
      if (branchId && cls.branchId !== branchId) {
        return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
      }
    }

    const material = await db.material.create({
      data: {
        title: d.title.trim(),
        description: null,
        classId: d.classId || null,
        subjectId: d.subjectId || null,
        uploaderId: session.userId,
        type: "AUDIO",
        fileUrl: d.url,
        duration: d.durationSec ?? null, // detik
        order: 0,
        isPublished: false, // draft — guru review dulu
        chapterTitle: d.chapterTitle || null,
        chapterOrder: d.chapterOrder ?? 0,
      },
    });

    if (body.jobId) {
      await db.aiGenerationJob
        .update({ where: { id: body.jobId }, data: { resultMaterialId: material.id, status: "DONE" } })
        .catch(() => undefined);
    }

    await logAudit({
      entity: "Material",
      entityId: material.id,
      action: "CREATE",
      after: { title: d.title, type: "AUDIO", source: "ai-builder" },
    });
    return NextResponse.json({ material }, { status: 201 });
  }

  // ---------- Mode 1: generate audio (TTS) ----------
  const { text, voice, speed, provider: clientProvider, model: clientModel } = body as {
    text?: string;
    voice?: string;
    speed?: number;
    provider?: string;
    model?: string;
  };

  if (!text?.trim()) {
    return NextResponse.json({ error: "Teks wajib diisi" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json({ error: `Teks terlalu panjang (maks ${MAX_TEXT_CHARS} karakter).` }, { status: 400 });
  }

  const providerId = clientProvider || settings.ttsProvider;
  const cfg = resolveTTSProviderConfig(providerId);
  if (!cfg.apiKey) {
    return NextResponse.json(
      { error: `Provider TTS belum dikonfigurasi. Admin perlu set ${cfg.keyEnvName} di environment variables.` },
      { status: 503 }
    );
  }

  const model = clientModel || cfg.defaultModel;
  const ttsSpeed = typeof speed === "number" ? Math.min(2, Math.max(0.25, speed)) : 1;
  const startedAt = Date.now();

  // Estimasi biaya: per menit audio (dibulatkan ke atas)
  const estDurationSec = Math.max(1, Math.round(text.trim().split(/\s+/).filter(Boolean).length / 2.5));
  const costPerMin = settings.unitCosts.AUDIO ?? 1000;
  const costEstimate = Math.ceil((estDurationSec / 60) * costPerMin) || costPerMin;

  try {
    const genCfg = { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey!, model };
    const audio = await generateAudio(providerId, genCfg, text.trim(), voice ?? "", ttsSpeed);

    // Upload ke Cloudinary — resource_type "video" (Cloudinary menggolongkan audio sebagai video)
    const filename = `ai_audio_${Date.now()}`;
    const { url, publicId } = await uploadToCloudinary(audio.buffer, "ai-materials", filename, "video");
    const media = await db.mediaFile.create({
      data: {
        name: `AI Audio: ${text.trim().slice(0, 30)}${text.length > 30 ? "…" : ""}`,
        url,
        publicId,
        resourceType: "video", // audio digolongkan sebagai video di Cloudinary
        mimeType: audio.mimeType,
        size: audio.buffer.length,
        folder: "ai-materials",
        uploadedById: session.userId,
      },
    });

    const durationMs = Date.now() - startedAt;

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "AUDIO",
        status: "DONE",
        provider: providerId,
        model,
        params: { textPreview: text.trim().slice(0, 100), voice: voice ?? null, speed: ttsSpeed, model } as never,
        resultUrl: url,
        resultMediaId: media.id,
        durationMs,
        costEstimate,
        createdBy: session.userId,
      },
    });
    await logAIUsage({
      userId: session.userId,
      capability: "AUDIO",
      provider: providerId,
      model,
      units: audio.durationSec, // detik audio
      costEstimate,
    });

    return NextResponse.json({
      audio: { url, mediaId: media.id, publicId, durationSec: audio.durationSec, mimeType: audio.mimeType },
      jobId: job.id,
    });
  } catch (e) {
    console.error("[AI audio generate] error:", e);
    const message = e instanceof Error ? e.message : "Gagal generate audio.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
