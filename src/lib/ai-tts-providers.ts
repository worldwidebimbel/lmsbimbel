// ============================================================
// AI TTS provider adapters — dipakai oleh route /api/ai/audio
// (Fase 3 — Materi Audio). Server-only: membaca API key dari env
// via resolveTTSProviderConfig.
// ============================================================

export interface TTSProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Header tambahan (mis. atribusi OpenRouter) — opsional. */
  headers?: Record<string, string>;
}

export interface GeneratedAudio {
  buffer: Buffer;
  mimeType: string;
  /** Estimasi durasi dalam detik (untuk usage log & Material.duration). */
  durationSec: number;
}

// Voice list per provider — prioritas voice Indonesia natural.
// Dipakai UI untuk dropdown pilihan voice.
export const TTS_VOICES: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "alloy", label: "Alloy (netral)" },
    { value: "ash", label: "Ash (pria, hangat)" },
    { value: "ballad", label: "Ballad (naratif)" },
    { value: "coral", label: "Coral (wanita, ceria)" },
    { value: "sage", label: "Sage (tenang)" },
    { value: "verse", label: "Verse (dinamis)" },
    { value: "nova", label: "Nova (wanita, jernih)" },
    { value: "shimmer", label: "Shimmer (wanita, cerah)" },
  ],
  // OpenRouter TTS — voice untuk model OpenAI (gpt-4o-mini-tts);
  // model lain (Voxtral/Fish) punya set voice berbeda — cek halaman modelnya.
  openrouter: [
    { value: "alloy", label: "Alloy (netral)" },
    { value: "ash", label: "Ash (pria, hangat)" },
    { value: "ballad", label: "Ballad (naratif)" },
    { value: "coral", label: "Coral (wanita, ceria)" },
    { value: "sage", label: "Sage (tenang)" },
    { value: "verse", label: "Verse (dinamis)" },
    { value: "nova", label: "Nova (wanita, jernih)" },
    { value: "shimmer", label: "Shimmer (wanita, cerah)" },
  ],
  google: [
    { value: "id-ID-Standard-A", label: "id-ID Standard A (wanita)" },
    { value: "id-ID-Standard-B", label: "id-ID Standard B (pria)" },
    { value: "id-ID-Standard-C", label: "id-ID Standard C (wanita)" },
    { value: "id-ID-Standard-D", label: "id-ID Standard D (pria)" },
    { value: "id-ID-Wavenet-A", label: "id-ID Wavenet A (wanita, natural)" },
    { value: "id-ID-Wavenet-B", label: "id-ID Wavenet B (pria, natural)" },
    { value: "id-ID-Wavenet-C", label: "id-ID Wavenet C (wanita, natural)" },
    { value: "id-ID-Wavenet-D", label: "id-ID Wavenet D (pria, natural)" },
    { value: "id-ID-Neural2-A", label: "id-ID Neural2 A (wanita, paling natural)" },
    { value: "id-ID-Neural2-B", label: "id-ID Neural2 B (pria, paling natural)" },
    { value: "id-ID-Neural2-C", label: "id-ID Neural2 C (wanita)" },
    { value: "id-ID-Neural2-D", label: "id-ID Neural2 D (pria)" },
  ],
  elevenlabs: [
    { value: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (wanita, tenang)" },
    { value: "AZnzlk1XvdvUeBnXmlld", label: "Domi (wanita, kuat)" },
    { value: "EXAVITQu4vr4xnSDxMaL", label: "Bella (wanita, muda)" },
    { value: "ErXwobaYiN019PkySvjV", label: "Antoni (pria, hangat)" },
    { value: "MF3mGyEYCl7XYWbV9V6O", label: "Elli (wanita, emosional)" },
    { value: "TxGEqnHWrfWFTfGW9XjX", label: "Josh (pria, muda)" },
    { value: "VR6AewLTigWG4xSOukaG", label: "Arnold (pria, kuat)" },
    { value: "pNInz6obpgDQGcFmaJgB", label: "Adam (pria, dalam)" },
  ],
};

/** Estimasi durasi audio dari panjang teks (fallback bila provider tidak beri info). */
export function estimateDurationSec(text: string): number {
  // Rata-rata kecepatan bicara Bahasa Indonesia ~150 kata/menit = 2.5 kata/detik.
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 2.5));
}

// ============================================================
// Provider adapters — masing-masing return audio buffer + durasi.
// ============================================================

async function generateWithOpenAI(
  cfg: TTSProviderConfig,
  text: string,
  voice: string,
  speed: number
): Promise<GeneratedAudio> {
  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      input: text,
      voice: voice || "alloy",
      speed,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI audio] OpenAI TTS error (${cfg.model}):`, errText);
    throw new Error(`OpenAI TTS error (HTTP ${res.status})`);
  }

  const ab = await res.arrayBuffer();
  return {
    buffer: Buffer.from(ab),
    mimeType: "audio/mpeg",
    durationSec: estimateDurationSec(text),
  };
}

async function generateWithGoogle(
  cfg: TTSProviderConfig,
  text: string,
  voice: string,
  speed: number
): Promise<GeneratedAudio> {
  // Google Cloud TTS: POST /v1/text:synthesize?key=API_KEY
  const voiceName = voice || "id-ID-Wavenet-A";
  const res = await fetch(`${cfg.baseUrl}/v1/text:synthesize?key=${cfg.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "id-ID", name: voiceName },
      audioConfig: { audioEncoding: "MP3", speakingRate: speed },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI audio] Google TTS error:`, errText);
    throw new Error(`Google Cloud TTS error (HTTP ${res.status})`);
  }

  const data = await res.json();
  const audioContent = data?.audioContent;
  if (!audioContent) throw new Error("Google TTS tidak mengembalikan audio");
  return {
    buffer: Buffer.from(audioContent, "base64"),
    mimeType: "audio/mpeg",
    durationSec: estimateDurationSec(text),
  };
}

async function generateWithElevenLabs(
  cfg: TTSProviderConfig,
  text: string,
  voice: string,
  speed: number
): Promise<GeneratedAudio> {
  // ElevenLabs: POST /v1/text-to-speech/{voice}
  const voiceId = voice || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`${cfg.baseUrl}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": cfg.apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: cfg.model,
      voice_settings: { speed, stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI audio] ElevenLabs error:`, errText);
    throw new Error(`ElevenLabs error (HTTP ${res.status})`);
  }

  const ab = await res.arrayBuffer();
  return {
    buffer: Buffer.from(ab),
    mimeType: "audio/mpeg",
    durationSec: estimateDurationSec(text),
  };
}

// OpenRouter TTS (docs: /docs/guides/overview/multimodal/tts)
// POST {baseUrl}/audio/speech — kompatibel OpenAI Audio Speech API → raw audio bytes.
async function generateWithOpenRouterTTS(
  cfg: TTSProviderConfig,
  text: string,
  voice: string,
  speed: number
): Promise<GeneratedAudio> {
  const res = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
      ...(cfg.headers ?? {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      input: text,
      voice: voice || "alloy",
      response_format: "mp3",
      speed,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AI audio] OpenRouter TTS error (${cfg.model}):`, errText);
    throw new Error(`OpenRouter TTS error (HTTP ${res.status})`);
  }

  const ab = await res.arrayBuffer();
  return {
    buffer: Buffer.from(ab),
    mimeType: "audio/mpeg",
    durationSec: estimateDurationSec(text),
  };
}

/**
 * Jalankan TTS via provider yang dipilih.
 * providerId: "openai" | "openrouter" | "google" | "elevenlabs"
 */
export async function generateAudio(
  providerId: string,
  cfg: TTSProviderConfig,
  text: string,
  voice: string,
  speed: number
): Promise<GeneratedAudio> {
  if (providerId === "openrouter") {
    return generateWithOpenRouterTTS(cfg, text, voice, speed);
  }
  if (providerId === "google") {
    return generateWithGoogle(cfg, text, voice, speed);
  }
  if (providerId === "elevenlabs") {
    return generateWithElevenLabs(cfg, text, voice, speed);
  }
  return generateWithOpenAI(cfg, text, voice, speed);
}
