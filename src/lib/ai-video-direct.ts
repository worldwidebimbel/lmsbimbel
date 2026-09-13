import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { logAIUsage } from "@/lib/ai-guard";
import { resolveProviderConfig, resolveVideoProviderConfig, type AIProviderId } from "@/lib/ai-providers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAISettings } from "@/lib/ai-settings";
import { setProgress, setFailed, type VideoJobProgress } from "@/lib/ai-video-pipeline";

// ============================================================
// AI Builder — Fase 4 (lanjutan): Direct video-gen via OpenRouter
// (future-commit.md §4.4 Strategi B — mode premium)
//
// Topik → AI Writer: satu prompt video sinematik
//      → OpenRouter POST /api/v1/videos (async: submit → poll)
//      → download hasil → Cloudinary → Material VIDEO
//
// Endpoint OpenRouter (docs: /docs/guides/overview/multimodal/video-generation):
// - POST {baseUrl}/videos { model, prompt, duration, resolution, aspect_ratio }
//   → { id, polling_url, status: "pending" }
// - GET polling_url (header auth) → { status: pending|in_progress|completed|failed,
//   unsigned_urls: [...] } — download dengan header auth yang sama.
// ============================================================

const POLL_INTERVAL_MS = 20_000;
const MAX_POLL_ATTEMPTS = 45; // ±15 menit

export interface DirectVideoJobRequest {
  topic: string;
  subjectName?: string;
  jenjang?: string;
  /** Durasi video (detik) — nilai bergantung model (mis. Veo 3.1: 4/6/8). */
  durationSec?: number;
  /** Resolusi ("720p" | "1080p"). */
  resolution?: string;
  /** Rasio ("16:9" | "9:16" | "1:1"). */
  aspectRatio?: string;
  /** Provider direct video-gen (saat ini hanya "openrouter"). */
  videoProvider?: string;
  videoModel?: string;
  /** Provider teks untuk menulis prompt video. */
  textProvider?: string;
  textModel?: string;
}

/** Tulis satu prompt video sinematik dari topik (via AI Writer — provider teks). */
async function buildVideoPrompt(req: DirectVideoJobRequest): Promise<string> {
  const providerConfig = resolveProviderConfig((req.textProvider ?? "apiclaude") as AIProviderId);
  if (!providerConfig.apiKey) {
    throw new Error(`Provider teks belum dikonfigurasi (${providerConfig.keyEnvName}).`);
  }
  const model = req.textModel || providerConfig.defaultModel;

  const res = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
      ...providerConfig.headers,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You convert educational topics into a single cinematic text-to-video prompt. Return ONLY the prompt text (in English), no JSON, no quotes, no explanation. One paragraph, 60-120 words, visually concrete (camera movement, scene, lighting), no on-screen text request.",
        },
        {
          role: "user",
          content: `Topic: ${req.topic.trim()}\nSubject: ${req.subjectName?.trim() || "Umum"}\nEducation level: ${req.jenjang?.trim() || "Umum"}\n\nWrite one detailed text-to-video prompt depicting this educational topic visually.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[AI video direct] prompt error:", errText);
    throw new Error("Gagal membuat prompt video (AI Writer).");
  }

  const data = await res.json();
  const prompt: string = (data.choices?.[0]?.message?.content ?? "").trim();
  if (!prompt) throw new Error("Prompt video kosong. Coba lagi.");
  return prompt;
}

/**
 * Jalankan pipeline direct video-gen untuk satu job. Dipanggil async
 * (tanpa await) oleh POST /api/ai/video bila mode = "direct".
 */
export async function runDirectVideoPipeline(jobId: string, req: DirectVideoJobRequest, userId: string): Promise<void> {
  const startedAt = Date.now();

  function progress(p: VideoJobProgress) {
    return setProgress(jobId, { ...p, mode: "direct" });
  }

  try {
    const videoCfg = resolveVideoProviderConfig(req.videoProvider ?? "openrouter");
    if (!videoCfg.apiKey) {
      throw new Error(`Provider video belum dikonfigurasi (${videoCfg.keyEnvName}).`);
    }
    const videoModel = req.videoModel || videoCfg.defaultModel;

    // ---- Step 1: prompt video ----
    await progress({ stage: "naskah", current: 0, total: 1, message: "Menyusun prompt video..." });
    const prompt = await buildVideoPrompt(req);
    await progress({ stage: "naskah", current: 1, total: 1, message: "Prompt video siap — mengirim ke provider..." });

    // ---- Step 2: submit + poll OpenRouter video job ----
    const submitRes = await fetch(`${videoCfg.baseUrl}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${videoCfg.apiKey}`,
        ...(videoCfg.headers ?? {}),
      },
      body: JSON.stringify({
        model: videoModel,
        prompt,
        ...(req.durationSec ? { duration: req.durationSec } : {}),
        ...(req.resolution ? { resolution: req.resolution } : {}),
        ...(req.aspectRatio ? { aspect_ratio: req.aspectRatio } : {}),
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("[AI video direct] submit error:", errText);
      throw new Error(`OpenRouter video submit error (HTTP ${submitRes.status}).`);
    }

    const submitted: { id?: string; polling_url?: string; status?: string } = await submitRes.json();
    const pollingUrl = submitted.polling_url ?? (submitted.id ? `${videoCfg.baseUrl}/videos/${submitted.id}` : null);
    if (!pollingUrl) throw new Error("OpenRouter tidak mengembalikan job video.");

    await progress({ stage: "render", current: 0, total: 1, message: `Video sedang dibuat oleh ${videoModel} (±2–5 menit)...` });

    let videoUrl: string | null = null;
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const pollRes = await fetch(pollingUrl, {
        headers: { Authorization: `Bearer ${videoCfg.apiKey}`, ...(videoCfg.headers ?? {}) },
      });
      if (!pollRes.ok) {
        console.error("[AI video direct] poll error HTTP", pollRes.status);
        continue; // transient — coba lagi
      }
      const status: { status?: string; unsigned_urls?: string[]; error?: string } = await pollRes.json();

      if (status.status === "completed" && status.unsigned_urls?.[0]) {
        videoUrl = status.unsigned_urls[0];
        break;
      }
      if (status.status === "failed") {
        throw new Error(`Video generation gagal: ${status.error ?? "tidak diketahui"}`);
      }

      const elapsed = Math.round(((attempt + 1) * POLL_INTERVAL_MS) / 1000);
      await progress({ stage: "render", current: attempt + 1, total: MAX_POLL_ATTEMPTS, message: `Menunggu render... ${elapsed}s` });
    }
    if (!videoUrl) throw new Error("Timeout menunggu video (±15 menit). Coba lagi.");

    // ---- Step 3: download → Cloudinary → Material VIDEO ----
    await progress({ stage: "upload", current: 0, total: 1, message: "Mengunduh & mengunggah video..." });
    const dlRes = await fetch(videoUrl, {
      headers: { Authorization: `Bearer ${videoCfg.apiKey}`, ...(videoCfg.headers ?? {}) },
    });
    if (!dlRes.ok) throw new Error(`Gagal mengunduh video (HTTP ${dlRes.status}).`);
    const videoBuffer = Buffer.from(await dlRes.arrayBuffer());

    const filename = `ai_video_direct_${Date.now()}`;
    const { url, publicId } = await uploadToCloudinary(videoBuffer, "ai-materials", filename, "video");
    const media = await db.mediaFile.create({
      data: {
        name: `AI Video (direct): ${req.topic.trim().slice(0, 40)}`,
        url,
        publicId,
        resourceType: "video",
        mimeType: "video/mp4",
        size: videoBuffer.length,
        folder: "ai-materials",
        uploadedById: userId,
      },
    });

    const material = await db.material.create({
      data: {
        title: req.topic.trim().slice(0, 120),
        description: `Video pembelajaran AI (direct gen, ${videoModel}) — ${req.topic.trim()}`,
        uploaderId: userId,
        type: "VIDEO",
        fileUrl: url,
        duration: req.durationSec ?? null,
        order: 0,
        isPublished: false, // draft — guru review dulu
      },
    });

    const durationMs = Date.now() - startedAt;
    const settings = await getAISettings();
    const costEstimate = settings.unitCosts.VIDEO ?? 8000;

    await db.aiGenerationJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        provider: req.videoProvider ?? "openrouter",
        model: videoModel,
        resultUrl: url,
        resultMediaId: media.id,
        resultMaterialId: material.id,
        durationMs,
        costEstimate,
        params: {
          request: req,
          mode: "direct",
          progress: { stage: "done", current: 1, total: 1, message: `${req.durationSec ?? ""}s • ${videoModel}`, mode: "direct" } as never,
        } as never,
      },
    });
    await logAIUsage({ userId, capability: "VIDEO", provider: req.videoProvider ?? "openrouter", model: videoModel, units: 1, costEstimate });
    await logAudit({ entity: "Material", entityId: material.id, action: "CREATE", after: { title: req.topic, type: "VIDEO", source: "ai-builder-video-direct" } });
  } catch (e) {
    console.error("[AI video direct pipeline] error:", e);
    const message = e instanceof Error ? e.message : "Pipeline video direct gagal.";
    await setFailed(jobId, message).catch(() => undefined);
  }
}
