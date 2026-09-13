import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isFeatureActive } from "@/lib/feature-flags";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { getAISettings } from "@/lib/ai-settings";
import type { AICapability } from "@/lib/ai-providers";

// ============================================================
// AI Builder guard — satu gerbang untuk semua kapabilitas AI
// (future-commit.md §3): rate limit → auth → feature flag → role →
// kuota bulanan → budget global. Route handler memanggil guardAI()
// sebelum mengeksekusi generate, lalu logAIUsage() setelah selesai.
// ============================================================

const CAPABILITY_RATE_LIMITS: Record<AICapability, (req: NextRequest) => NextResponse | null> = {
  TEXT: RATE_LIMITS.aiText,
  QUESTION: RATE_LIMITS.ai,
  IMAGE: RATE_LIMITS.aiImage,
  DESIGN: RATE_LIMITS.aiDesign,
  AUDIO: RATE_LIMITS.aiAudio,
  VIDEO: RATE_LIMITS.aiVideo,
};

/** Flag per kapabilitas — TEXT tidak punya flag sendiri (cukup FEAT_AI_BUILDER). */
const CAPABILITY_FLAGS: Partial<Record<AICapability, string>> = {
  QUESTION: "FEAT_AI_QUESTION",
  IMAGE: "FEAT_AI_IMAGE",
  DESIGN: "FEAT_AI_DESIGN",
  AUDIO: "FEAT_AI_AUDIO",
  VIDEO: "FEAT_AI_VIDEO",
};

export interface AISession {
  userId: string;
  role: string;
  name?: string | null;
}

function err(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Guard semua endpoint generate AI. Return `{ session }` bila lolos,
 * atau NextResponse error (langsung return ke client).
 */
export async function guardAI(req: NextRequest, capability: AICapability): Promise<{ session: AISession } | NextResponse> {
  // 1. Rate limit per kapabilitas
  const limited = CAPABILITY_RATE_LIMITS[capability](req);
  if (limited) return limited;

  // 2. Auth
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return err(403, "Forbidden");

  // 3. Feature flag modul
  if (!(await isFeatureActive("FEAT_AI_BUILDER"))) {
    return err(503, "Modul AI Builder belum diaktifkan. Super Admin dapat mengaktifkannya lewat Fitur & Modul (FEAT_AI_BUILDER).");
  }

  const settings = await getAISettings();
  const role = session.user.role;

  // 4. Gate role modul
  if (!settings.accessRoles.includes(role)) {
    return err(403, "Role Anda tidak memiliki akses ke AI Builder.");
  }

  // 5. Override role per kapabilitas (mis. DESIGN default hanya Super Admin & Admin)
  const capRoles = settings.capabilityRoles[capability];
  if (capRoles && !capRoles.includes(role)) {
    return err(403, `Kapabilitas ${capability} tidak tersedia untuk role Anda.`);
  }

  // 6. Feature flag per kapabilitas
  const flag = CAPABILITY_FLAGS[capability];
  if (flag && !(await isFeatureActive(flag))) {
    return err(503, `Kapabilitas ${capability} belum diaktifkan (${flag}). Aktifkan lewat Fitur & Modul.`);
  }

  // 7. Kuota bulanan per role per kapabilitas
  const quota = settings.quotas[role]?.[capability] ?? 0;
  if (quota <= 0) {
    return err(403, `Kuota ${capability} untuk role ${role} belum diset. Atur di AI Builder → Pengaturan.`);
  }
  const used = await db.aiUsageLog.aggregate({
    _sum: { units: true },
    where: { userId: session.user.id, capability, createdAt: { gte: startOfMonth() } },
  });
  if ((used._sum.units ?? 0) >= quota) {
    return err(429, `Kuota bulanan ${capability} untuk role ${role} sudah habis (${quota}). Naikkan kuota di AI Builder → Pengaturan atau tunggu bulan depan.`);
  }

  // 8. Budget global bulanan (estimasi biaya)
  if (settings.monthlyBudget > 0) {
    const spent = await db.aiUsageLog.aggregate({
      _sum: { costEstimate: true },
      where: { createdAt: { gte: startOfMonth() } },
    });
    if ((spent._sum.costEstimate ?? 0) >= settings.monthlyBudget) {
      return err(429, `Budget AI bulanan (Rp ${settings.monthlyBudget.toLocaleString("id-ID")}) sudah terpakai. Naikkan di AI Builder → Pengaturan.`);
    }
  }

  return { session: { userId: session.user.id, role, name: session.user.name } };
}

/** Catat pemakaian setelah generate sukses — dasar kuota & laporan biaya. */
export async function logAIUsage(params: {
  userId: string;
  capability: AICapability;
  provider?: string;
  model?: string;
  units?: number;
  costEstimate?: number;
}): Promise<void> {
  await db.aiUsageLog.create({
    data: {
      userId: params.userId,
      capability: params.capability,
      provider: params.provider ?? null,
      model: params.model ?? null,
      units: params.units ?? 1,
      costEstimate: params.costEstimate ?? null,
    },
  });
  await logAudit({
    entity: "AiUsageLog",
    entityId: `${params.capability}:${params.userId}`,
    action: "CREATE",
    after: { capability: params.capability, provider: params.provider ?? null, units: params.units ?? 1 },
  });
}

/** Ringkasan pemakaian bulan berjalan untuk satu user — dipakai UI Riwayat. */
export async function getMonthlyUsageSummary(userId: string) {
  const since = startOfMonth();
  const grouped = await db.aiUsageLog.groupBy({
    by: ["capability"],
    where: { userId, createdAt: { gte: since } },
    _sum: { units: true, costEstimate: true },
    _count: true,
  });
  return grouped.map((g) => ({
    capability: g.capability as AICapability,
    units: g._sum.units ?? 0,
    cost: g._sum.costEstimate ?? 0,
    count: g._count,
  }));
}
