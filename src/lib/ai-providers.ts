/**
 * AI provider registry shared between the generator UI and the API route.
 *
 * Only non-secret metadata lives here (ids, labels, model slugs) so this module
 * is safe to import from client components. API keys and base URLs are resolved
 * server-side in `resolveProviderConfig`, which must only run on the server.
 */

export type AIProviderId = "apiclaude" | "openrouter";

export interface AIModelOption {
  value: string;
  label: string;
}

export interface AIProviderMeta {
  id: AIProviderId;
  label: string;
  /** Docs / dashboard link shown as a hint in the UI. */
  site: string;
  models: AIModelOption[];
}

export const AI_PROVIDERS: AIProviderMeta[] = [
  {
    id: "apiclaude",
    label: "APIClaude.net",
    site: "https://apiclaude.net",
    models: [
      { value: "langgananku/claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Recommended)" },
      { value: "langgananku/claude-opus-5", label: "Claude Opus 5" },
      { value: "cbcn/glm-5.2", label: "GLM 5.2" },
      { value: "cbcn/deepseek-v3", label: "DeepSeek V3" },
      { value: "gcli/grok-3", label: "Grok 3" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter.ai",
    site: "https://openrouter.ai/models",
    models: [
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Recommended)" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o mini (murah)" },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (cepat)" },
      { value: "deepseek/deepseek-chat", label: "DeepSeek V3" },
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { value: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
      { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (gratis)" },
    ],
  },
];

export const DEFAULT_PROVIDER_ID: AIProviderId = "apiclaude";

export function getProvider(id?: string): AIProviderMeta {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}

export interface ResolvedProviderConfig {
  baseUrl: string;
  apiKey?: string;
  headers: Record<string, string>;
  defaultModel: string;
  /** Env var name to mention in the error message when the key is missing. */
  keyEnvName: string;
}

/**
 * Resolve the runtime configuration for a provider. Server-only: reads
 * environment variables that hold API keys.
 */
export function resolveProviderConfig(id: AIProviderId): ResolvedProviderConfig {
  if (id === "openrouter") {
    const headers: Record<string, string> = {};
    // OpenRouter uses these for attribution / rankings; both are optional.
    const referer = process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const title = process.env.OPENROUTER_SITE_NAME || process.env.NEXT_PUBLIC_APP_NAME;
    if (referer) headers["HTTP-Referer"] = referer;
    if (title) headers["X-Title"] = title;

    return {
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      headers,
      defaultModel: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
      keyEnvName: "OPENROUTER_API_KEY",
    };
  }

  return {
    baseUrl: process.env.AI_BASE_URL || "https://apiclaude.net/v1",
    apiKey: process.env.APICLAUDE_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    headers: {},
    defaultModel: process.env.AI_MODEL || "langgananku/claude-sonnet-4-20250514",
    keyEnvName: "APICLAUDE_API_KEY (atau OPENAI_API_KEY)",
  };
}

// ============================================================
// AI Builder — registry per kapabilitas (future-commit.md)
// TEXT/QUESTION memakai AI_PROVIDERS di atas; IMAGE/DESIGN/AUDIO/VIDEO
// punya registry sendiri. DESIGN memakai provider IMAGE yang sama.
// ============================================================

export type AICapability = "TEXT" | "IMAGE" | "DESIGN" | "AUDIO" | "VIDEO" | "QUESTION";

export const AI_CAPABILITIES: { id: AICapability; label: string; description: string; unitLabel: string }[] = [
  { id: "TEXT", label: "Materi Teks", description: "Artikel/ringkasan materi pelajaran (rich text + key points)", unitLabel: "materi" },
  { id: "IMAGE", label: "Materi Gambar", description: "Ilustrasi & diagram untuk materi dan soal", unitLabel: "gambar" },
  { id: "DESIGN", label: "Aset Visual CMS", description: "Banner, hero/slider, cover program, popup, gambar LP/CP — untuk admin", unitLabel: "aset" },
  { id: "AUDIO", label: "Materi Audio", description: "Narasi materi (text-to-speech)", unitLabel: "menit" },
  { id: "VIDEO", label: "Materi Video", description: "Video pembelajaran audio-visual (composite pipeline)", unitLabel: "video" },
  { id: "QUESTION", label: "Soal", description: "AI Question Generator (sudah ada, akan disatukan)", unitLabel: "batch" },
];

/** Provider generik — bentuk sama dengan AIProviderMeta agar bisa dirender settings UI. */
export interface AIGenericProviderMeta {
  id: string;
  label: string;
  site: string;
  models: AIModelOption[];
}

export const AI_IMAGE_PROVIDERS: AIGenericProviderMeta[] = [
  {
    id: "openai",
    label: "OpenAI Images",
    site: "https://platform.openai.com/docs/guides/images",
    models: [
      { value: "gpt-image-1", label: "GPT Image 1 (Recommended)" },
      { value: "dall-e-3", label: "DALL-E 3" },
    ],
  },
  {
    id: "replicate",
    label: "Replicate (Flux/SDXL)",
    site: "https://replicate.com/collections/text-to-image",
    models: [
      { value: "black-forest-labs/flux-schnell", label: "Flux Schnell (murah & cepat)" },
      { value: "stability-ai/sdxl", label: "SDXL" },
    ],
  },
  {
    id: "stability",
    label: "Stability AI",
    site: "https://platform.stability.ai/docs/api-reference",
    models: [{ value: "sd3.5-large", label: "Stable Diffusion 3.5 Large" }],
  },
];

export const AI_TTS_PROVIDERS: AIGenericProviderMeta[] = [
  {
    id: "openai",
    label: "OpenAI TTS",
    site: "https://platform.openai.com/docs/guides/text-to-speech",
    models: [
      { value: "gpt-4o-mini-tts", label: "GPT-4o mini TTS (Recommended)" },
      { value: "tts-1", label: "TTS-1" },
    ],
  },
  {
    id: "google",
    label: "Google Cloud TTS",
    site: "https://cloud.google.com/text-to-speech",
    models: [{ value: "id-ID-Neural2", label: "id-ID Neural2 (voice Indonesia)" }],
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    site: "https://elevenlabs.io/docs",
    models: [{ value: "eleven_multilingual_v2", label: "Multilingual v2" }],
  },
];

export const AI_VIDEO_MODES: AIModelOption[] = [
  { value: "composite", label: "Composite (hemat — naskah + gambar + TTS + FFmpeg)" },
  { value: "direct", label: "Direct video-gen (premium — Runway/Veo, fase lanjutan)" },
];

export function getProvidersForCapability(capability: AICapability): AIGenericProviderMeta[] {
  switch (capability) {
    case "TEXT":
    case "QUESTION":
      return AI_PROVIDERS;
    case "IMAGE":
    case "DESIGN":
      return AI_IMAGE_PROVIDERS;
    case "AUDIO":
      return AI_TTS_PROVIDERS;
    case "VIDEO":
      return []; // video: mode (composite/direct), bukan daftar provider — Fase 4
  }
}

// ---------- Resolver server-side: status konfigurasi per provider ----------
// Hanya dipanggil dari route handler (membaca env — mengikuti konvensi resolveProviderConfig).

export function resolveImageProviderConfig(id: string): ResolvedProviderConfig {
  if (id === "replicate") {
    return {
      baseUrl: process.env.REPLICATE_BASE_URL || "https://api.replicate.com/v1",
      apiKey: process.env.REPLICATE_API_KEY,
      headers: {},
      defaultModel: process.env.AI_IMAGE_MODEL || "black-forest-labs/flux-schnell",
      keyEnvName: "REPLICATE_API_KEY",
    };
  }
  if (id === "stability") {
    return {
      baseUrl: process.env.STABILITY_BASE_URL || "https://api.stability.ai/v1",
      apiKey: process.env.STABILITY_API_KEY,
      headers: {},
      defaultModel: process.env.AI_IMAGE_MODEL || "sd3.5-large",
      keyEnvName: "STABILITY_API_KEY",
    };
  }
  return {
    baseUrl: process.env.OPENAI_IMAGES_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_IMAGES_API_KEY || process.env.OPENAI_API_KEY,
    headers: {},
    defaultModel: process.env.AI_IMAGE_MODEL || "gpt-image-1",
    keyEnvName: "OPENAI_IMAGES_API_KEY (atau OPENAI_API_KEY)",
  };
}

export function resolveTTSProviderConfig(id: string): ResolvedProviderConfig {
  if (id === "google") {
    return {
      baseUrl: process.env.GOOGLE_TTS_BASE_URL || "https://texttospeech.googleapis.com",
      apiKey: process.env.GOOGLE_TTS_API_KEY,
      headers: {},
      defaultModel: process.env.AI_TTS_MODEL || "id-ID-Neural2",
      keyEnvName: "GOOGLE_TTS_API_KEY",
    };
  }
  if (id === "elevenlabs") {
    return {
      baseUrl: process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io/v1",
      apiKey: process.env.ELEVENLABS_API_KEY,
      headers: {},
      defaultModel: process.env.AI_TTS_MODEL || "eleven_multilingual_v2",
      keyEnvName: "ELEVENLABS_API_KEY",
    };
  }
  return {
    baseUrl: process.env.OPENAI_TTS_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_TTS_API_KEY || process.env.OPENAI_API_KEY,
    headers: {},
    defaultModel: process.env.AI_TTS_MODEL || "gpt-4o-mini-tts",
    keyEnvName: "OPENAI_TTS_API_KEY (atau OPENAI_API_KEY)",
  };
}
