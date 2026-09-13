// ============================================================
// AI image provider adapters — dipakai bersama oleh route
// /api/ai/image (Fase 2) dan /api/ai/design (Fase 2b).
// Server-only: membaca API key dari env via resolveImageProviderConfig.
// ============================================================

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

// Ukuran per model OpenAI (gpt-image-1 & dall-e-3 punya set size berbeda)
const OPENAI_SIZES: Record<string, Record<AspectRatio, string>> = {
  "gpt-image-1": { "1:1": "1024x1024", "16:9": "1536x1024", "9:16": "1024x1536", "4:3": "1024x1024" },
  "dall-e-3": { "1:1": "1024x1024", "16:9": "1792x1024", "9:16": "1024x1792", "4:3": "1024x1024" },
};

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

export interface ImageProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Header tambahan (mis. atribusi OpenRouter) — opsional. */
  headers?: Record<string, string>;
}

// OpenRouter Image API (docs: /docs/guides/overview/multimodal/image-generation)
// POST {baseUrl}/images → { data: [{ b64_json, media_type }], usage }
async function generateWithOpenRouterImages(
  cfg: ImageProviderConfig,
  prompt: string,
  aspectRatio: AspectRatio,
  count: number
): Promise<GeneratedImage[]> {
  const res = await fetch(`${cfg.baseUrl}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.headers ?? {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      prompt,
      n: Math.min(10, count),
      aspect_ratio: aspectRatio,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI image] OpenRouter error (${cfg.model}):`, errText);
    throw new Error(`OpenRouter Images error (HTTP ${res.status})`);
  }

  const data = await res.json();
  const items: Array<{ b64_json?: string; media_type?: string }> = data?.data ?? [];
  const results: GeneratedImage[] = [];
  for (const item of items) {
    if (item.b64_json) {
      results.push({
        buffer: Buffer.from(item.b64_json, "base64"),
        mimeType: item.media_type || "image/png",
      });
    }
  }
  return results;
}

async function generateWithOpenAI(
  cfg: ImageProviderConfig,
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
  cfg: ImageProviderConfig,
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
  cfg: ImageProviderConfig,
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

/**
 * Jalankan generate image via provider yang dipilih.
 * providerId: "openai" | "replicate" | "stability"
 */
export async function generateImages(
  providerId: string,
  cfg: ImageProviderConfig,
  prompt: string,
  aspectRatio: AspectRatio,
  count: number
): Promise<GeneratedImage[]> {
  if (providerId === "openrouter") {
    return generateWithOpenRouterImages(cfg, prompt, aspectRatio, count);
  }
  if (providerId === "replicate") {
    return generateWithReplicate(cfg, prompt, aspectRatio, count);
  }
  if (providerId === "stability") {
    return generateWithStability(cfg, prompt, aspectRatio, count);
  }
  return generateWithOpenAI(cfg, prompt, aspectRatio, count);
}
