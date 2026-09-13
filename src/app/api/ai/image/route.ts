import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guardAI, logAIUsage } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import { resolveImageProviderConfig } from "@/lib/ai-providers";
import { getBranchScope } from "@/lib/branch-context";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ============================================================
// AI Builder — Fase 2: Materi Gambar (AI Image)
// Dua mode (mengikuti pola /api/ai/text):
// 1. Generate: { prompt, style, aspectRatio, count, provider, model }
//    → panggil provider image → upload Cloudinary ("ai-materials")
//    → MediaFile → AiGenerationJob (DONE) → usage log
//    → { images: [{ url, mediaId, publicId }], jobId }
// 2. Save:    { saveImage: { url, mediaId, title, classId, subjectId,
//                            chapterTitle }, jobId }
//    → Material (type IMAGE, isPublished: false) — guru review dulu
// ============================================================

// ---------- Style preset (gaya edukatif, future-commit.md §4.2) ----------
const STYLE_PRESETS: Record<string, string> = {
  flatvector: "flat vector illustration, clean minimal lines, solid colors, educational",
  diagram: "labeled educational diagram, clear annotations, clean technical style",
  kartun: "friendly cartoon illustration, colorful, suitable for students",
  whiteboard: "whiteboard hand-drawn sketch style, black ink on white background",
  realistic: "realistic detailed illustration, natural lighting",
  custom: "", // prompt apa adanya
};

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3"] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

// Ukuran per model OpenAI (gpt-image-1 & dall-e-3 punya set size berbeda)
const OPENAI_SIZES: Record<string, Record<AspectRatio, string>> = {
  "gpt-image-1": { "1:1": "1024x1024", "16:9": "1536x1024", "9:16": "1024x1536", "4:3": "1024x1024" },
  "dall-e-3": { "1:1": "1024x1024", "16:9": "1792x1024", "9:16": "1024x1792", "4:3": "1024x1024" },
};

interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

// ============================================================
// Provider adapters — masing-masing return array of image buffers.
// Dipanggil server-side; key dari resolveImageProviderConfig (env).
// ============================================================

async function generateWithOpenAI(
  cfg: { baseUrl: string; apiKey: string; model: string },
  prompt: string,
  aspectRatio: AspectRatio,
  count: number
): Promise<GeneratedImage[]> {
  const model = cfg.model;
  const sizeMap = OPENAI_SIZES[model] ?? OPENAI_SIZES["gpt-image-1"];
  const size = sizeMap[aspectRatio];

  // dall-e-3 hanya mendukung n=1 → loop bila count > 1
  const isDalle3 = model === "dall-e-3";
  const requests = isDalle3 ? Math.max(1, count) : 1;
  const n = isDalle3 ? 1 : Math.min(10, count);

  const results: GeneratedImage[] = [];
  for (let i = 0; i < requests; i++) {
    const body: Record<string, unknown> = { model, prompt, n, size };
    if (isDalle3) body.response_format = "b64_json";

    const res = await fetch(`${cfg.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[AI image] OpenAI error (${model}):`, errText);
      throw new Error(`OpenAI Images error (HTTP ${res.status})`);
    }

    const data = await res.json();
    const items: Array<{ b64_json?: string; url?: string }> = data?.data ?? [];
    for (const item of items) {
      if (item.b64_json) {
        results.push({ buffer: Buffer.from(item.b64_json, "base64"), mimeType: "image/png" });
      } else if (item.url) {
        const imgRes = await fetch(item.url);
        if (!imgRes.ok) throw new Error("Gagal mengunduh gambar dari OpenAI URL");
        const ab = await imgRes.arrayBuffer();
        results.push({ buffer: Buffer.from(ab), mimeType: imgRes.headers.get("content-type") || "image/png" });
      }
    }
  }
  return results;
}

async function generateWithReplicate(
  cfg: { baseUrl: string; apiKey: string; model: string },
  prompt: string,
  aspectRatio: AspectRatio,
  count: number
): Promise<GeneratedImage[]> {
  // Replicate model identifier: "owner/name" → endpoint /v1/models/{owner}/{name}/predictions
  const modelSlug = cfg.model; // mis. "black-forest-labs/flux-schnell"
  const numOutputs = Math.min(4, count);

  const createRes = await fetch(`${cfg.baseUrl}/models/${modelSlug}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      Prefer: "wait", // tunggu hasil sampai 60s bila memungkinkan
    },
    body: JSON.stringify({
      input: { prompt, aspect_ratio: aspectRatio, num_outputs: numOutputs, output_format: "png" },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error(`[AI image] Replicate create error (${modelSlug}):`, errText);
    throw new Error(`Replicate error (HTTP ${createRes.status})`);
  }

  let prediction: { status: string; output?: string[] | string; urls?: { get?: string } } = await createRes.json();

  // Poll bila belum selesai (Prefer: wait tidak selalu cukup)
  let attempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 60) {
    await new Promise((r) => setTimeout(r, 2000));
    if (!prediction.urls?.get) break;
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    if (!pollRes.ok) throw new Error("Replicate poll error");
    prediction = await pollRes.json();
    attempts++;
  }

  if (prediction.status === "failed") throw new Error("Replicate prediction gagal");
  if (!prediction.output) throw new Error("Replicate tidak mengembalikan output");

  const urls = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
  const results: GeneratedImage[] = [];
  for (const url of urls) {
    if (typeof url !== "string") continue;
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error("Gagal mengunduh gambar dari Replicate");
    const ab = await imgRes.arrayBuffer();
    results.push({ buffer: Buffer.from(ab), mimeType: imgRes.headers.get("content-type") || "image/png" });
  }
  return results;
}

async function generateWithStability(
  cfg: { baseUrl: string; apiKey: string; model: string },
  prompt: string,
  aspectRatio: AspectRatio,
  count: number
): Promise<GeneratedImage[]> {
  // Stability v2beta stable-image generate (sd3). count > 1 → loop (API return 1 gambar per call).
  const results: GeneratedImage[] = [];
  const calls = Math.min(4, count);
  for (let i = 0; i < calls; i++) {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("aspect_ratio", aspectRatio);
    form.append("output_format", "png");

    const res = await fetch(`${cfg.baseUrl}/v2beta/stable-image/generate/sd3`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        Accept: "image/png",
      },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[AI image] Stability error:`, errText);
      throw new Error(`Stability AI error (HTTP ${res.status})`);
    }

    const ab = await res.arrayBuffer();
    results.push({ buffer: Buffer.from(ab), mimeType: "image/png" });
  }
  return results;
}

// ============================================================
// Route handler
// ============================================================

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "IMAGE");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();

  // ---------- Mode 2: simpan sebagai Material IMAGE (draft) ----------
  if (body?.saveImage) {
    const d = body.saveImage as {
      url?: string;
      mediaId?: string;
      title?: string;
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
        type: "IMAGE",
        fileUrl: d.url,
        order: 0,
        isPublished: false, // draft — guru review dulu (moderasi)
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
      after: { title: d.title, type: "IMAGE", source: "ai-builder" },
    });
    return NextResponse.json({ material }, { status: 201 });
  }

  // ---------- Mode 1: generate gambar ----------
  const {
    prompt,
    style,
    aspectRatio,
    count,
    provider: clientProvider,
    model: clientModel,
  } = body as {
    prompt?: string;
    style?: string;
    aspectRatio?: string;
    count?: number;
    provider?: string;
    model?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
  }

  const providerId = clientProvider || settings.imageProvider;
  const cfg = resolveImageProviderConfig(providerId);
  if (!cfg.apiKey) {
    return NextResponse.json(
      { error: `Provider gambar belum dikonfigurasi. Admin perlu set ${cfg.keyEnvName} di environment variables.` },
      { status: 503 }
    );
  }

  const model = clientModel || cfg.defaultModel;
  const aspect = (ASPECT_RATIOS.includes(aspectRatio as AspectRatio) ? aspectRatio : "1:1") as AspectRatio;
  const numImages = Math.min(4, Math.max(1, Number(count) || 1));
  const styleKey = style && STYLE_PRESETS[style] !== undefined ? style : "custom";
  const styleHint = STYLE_PRESETS[styleKey] ?? "";
  const fullPrompt = styleHint ? `${prompt.trim()}. Style: ${styleHint}.` : prompt.trim();

  const startedAt = Date.now();
  const costPerImage = settings.unitCosts.IMAGE ?? 1500;
  const costEstimate = costPerImage * numImages;

  try {
    let images: GeneratedImage[] = [];
    const genCfg = { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey!, model };

    if (providerId === "replicate") {
      images = await generateWithReplicate(genCfg, fullPrompt, aspect, numImages);
    } else if (providerId === "stability") {
      images = await generateWithStability(genCfg, fullPrompt, aspect, numImages);
    } else {
      images = await generateWithOpenAI(genCfg, fullPrompt, aspect, numImages);
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "Provider tidak mengembalikan gambar. Coba lagi." }, { status: 502 });
    }

    // Upload setiap gambar ke Cloudinary + buat MediaFile
    const uploaded: { url: string; mediaId: string; publicId: string }[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const filename = `ai_${Date.now()}_${i}`;
      const { url, publicId } = await uploadToCloudinary(img.buffer, "ai-materials", filename, "image");
      const media = await db.mediaFile.create({
        data: {
          name: `AI ${prompt.trim().slice(0, 40)}${prompt.length > 40 ? "…" : ""}`,
          url,
          publicId,
          resourceType: "image",
          mimeType: img.mimeType,
          size: img.buffer.length,
          folder: "ai-materials",
          uploadedById: session.userId,
        },
      });
      uploaded.push({ url, mediaId: media.id, publicId });
    }

    const durationMs = Date.now() - startedAt;

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "IMAGE",
        status: "DONE",
        provider: providerId,
        model,
        params: { prompt: prompt.trim(), style: styleKey, aspectRatio: aspect, count: numImages } as never,
        resultUrl: uploaded[0]?.url ?? null,
        resultMediaId: uploaded[0]?.mediaId ?? null,
        durationMs,
        costEstimate,
        createdBy: session.userId,
      },
    });
    await logAIUsage({
      userId: session.userId,
      capability: "IMAGE",
      provider: providerId,
      model,
      units: uploaded.length,
      costEstimate,
    });

    return NextResponse.json({ images: uploaded, jobId: job.id });
  } catch (e) {
    console.error("[AI image generate] error:", e);
    const message = e instanceof Error ? e.message : "Gagal generate gambar.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
