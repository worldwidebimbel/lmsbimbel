import { db } from "@/lib/db";
import type { AICapability } from "@/lib/ai-providers";
import {
  AI_IMAGE_PROVIDERS,
  AI_PROVIDERS,
  AI_TTS_PROVIDERS,
  resolveImageProviderConfig,
  resolveProviderConfig,
  resolveTTSProviderConfig,
  type AIProviderId,
} from "@/lib/ai-providers";

// ============================================================
// AI Builder settings — disimpan di AppSetting (key-value), runtime-configurable.
// Lihat doc/future-commit.md §5.5 & §10: semua aspek operasional bisa
// diubah Super Admin tanpa deploy ulang. Kunci API TETAP di env vars.
// ============================================================

export interface AIQuotaMatrix {
  [role: string]: { [C in AICapability]?: number };
}

export interface AISettings {
  // Provider aktif per kapabilitas
  textProvider: string;
  imageProvider: string;
  designProvider: string;
  ttsProvider: string;
  // Video & storage
  videoMode: "composite" | "direct";
  videoStorage: "cloudinary" | "local";
  // Transparansi
  labelEnabled: boolean;
  // Budget & biaya
  monthlyBudget: number; // rupiah, 0 = tanpa batas
  unitCosts: Record<string, number>; // rupiah per unit per kapabilitas
  // Akses
  accessRoles: string[]; // gate modul
  capabilityRoles: Partial<Record<AICapability, string[]>>; // override per kapabilitas
  // Kuota bulanan per role per kapabilitas
  quotas: AIQuotaMatrix;
}

const DEFAULT_QUOTAS: AIQuotaMatrix = {
  GURU: { TEXT: 100, IMAGE: 50, DESIGN: 0, AUDIO: 60, VIDEO: 10, QUESTION: 100 },
  ADMIN_CABANG: { TEXT: 100, IMAGE: 50, DESIGN: 0, AUDIO: 60, VIDEO: 10, QUESTION: 100 },
  ADMIN_AKADEMIK: { TEXT: 100, IMAGE: 50, DESIGN: 0, AUDIO: 60, VIDEO: 10, QUESTION: 100 },
  ADMIN: { TEXT: 200, IMAGE: 100, DESIGN: 50, AUDIO: 120, VIDEO: 20, QUESTION: 200 },
  SUPER_ADMIN: { TEXT: 500, IMAGE: 200, DESIGN: 200, AUDIO: 300, VIDEO: 50, QUESTION: 500 },
};

const DEFAULT_UNIT_COSTS: Record<string, number> = {
  TEXT: 300,
  IMAGE: 1500,
  DESIGN: 1500,
  AUDIO: 1000, // per menit
  VIDEO: 8000,
  QUESTION: 500,
};

// Kunci AppSetting — semua berawalan "ai_"
export const AI_SETTING_DEFAULTS: Record<string, string> = {
  ai_text_provider: "apiclaude",
  ai_image_provider: "openai",
  ai_design_provider: "openai",
  ai_tts_provider: "openai",
  ai_video_mode: "composite",
  ai_video_storage: "cloudinary",
  ai_label_enabled: "true",
  ai_monthly_budget: "500000",
  ai_unit_costs: JSON.stringify(DEFAULT_UNIT_COSTS),
  ai_access_roles: "GURU,SUPER_ADMIN,ADMIN,ADMIN_CABANG,ADMIN_AKADEMIK",
  ai_capability_roles: JSON.stringify({ DESIGN: ["SUPER_ADMIN", "ADMIN"] }),
  ai_quotas: JSON.stringify(DEFAULT_QUOTAS),
};

function parseCsv(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function safeParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getAISettings(): Promise<AISettings> {
  const rows = await db.appSetting.findMany({ where: { key: { startsWith: "ai_" } } });
  const map: Record<string, string> = { ...AI_SETTING_DEFAULTS };
  for (const r of rows) map[r.key] = r.value;

  return {
    textProvider: map.ai_text_provider,
    imageProvider: map.ai_image_provider,
    designProvider: map.ai_design_provider,
    ttsProvider: map.ai_tts_provider,
    videoMode: map.ai_video_mode === "direct" ? "direct" : "composite",
    videoStorage: map.ai_video_storage === "local" ? "local" : "cloudinary",
    labelEnabled: map.ai_label_enabled === "true",
    monthlyBudget: parseInt(map.ai_monthly_budget, 10) || 0,
    unitCosts: safeParse(map.ai_unit_costs, DEFAULT_UNIT_COSTS),
    accessRoles: parseCsv(map.ai_access_roles),
    capabilityRoles: safeParse(map.ai_capability_roles, {} as AISettings["capabilityRoles"]),
    quotas: safeParse(map.ai_quotas, DEFAULT_QUOTAS),
  };
}

/** Upsert satu atau beberapa setting AI (dipakai route PATCH /api/ai/settings). */
export async function updateAISettings(values: Record<string, string>): Promise<void> {
  const allowed = new Set(Object.keys(AI_SETTING_DEFAULTS));
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) continue;
    await db.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

export interface ProviderStatusItem {
  id: string;
  label: string;
  configured: boolean;
  keyEnvName: string;
}

export interface ProviderStatusMap {
  text: ProviderStatusItem[];
  image: ProviderStatusItem[];
  tts: ProviderStatusItem[];
}

/** Status konfigurasi key per provider (server-only — membaca env). */
export function getProviderStatus(): ProviderStatusMap {
  const text = AI_PROVIDERS.map((p) => {
    const cfg = resolveProviderConfig(p.id as AIProviderId);
    return { id: p.id, label: p.label, configured: !!cfg.apiKey, keyEnvName: cfg.keyEnvName };
  });
  const image = AI_IMAGE_PROVIDERS.map((p) => {
    const cfg = resolveImageProviderConfig(p.id);
    return { id: p.id, label: p.label, configured: !!cfg.apiKey, keyEnvName: cfg.keyEnvName };
  });
  const tts = AI_TTS_PROVIDERS.map((p) => {
    const cfg = resolveTTSProviderConfig(p.id);
    return { id: p.id, label: p.label, configured: !!cfg.apiKey, keyEnvName: cfg.keyEnvName };
  });
  return { text, image, tts };
}
