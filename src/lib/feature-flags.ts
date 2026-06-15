import { db } from "@/lib/db";
import type { FeatureFlag } from "@/types";

let cache: FeatureFlag[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  const flags = await db.featureFlag.findMany({
    orderBy: { sortOrder: "asc" },
  });

  cache = flags as FeatureFlag[];
  cacheTime = now;
  return cache;
}

export async function isFeatureActive(code: string): Promise<boolean> {
  const flags = await getAllFeatureFlags();
  const flag = flags.find((f) => f.code === code);
  return flag?.isActive ?? false;
}

export async function toggleFeature(
  code: string,
  isActive: boolean,
  userId: string
): Promise<FeatureFlag> {
  const updated = await db.featureFlag.update({
    where: { code },
    data: { isActive, modifiedBy: userId, updatedAt: new Date() },
  });

  await db.featureFlagLog.create({
    data: {
      flagCode: code,
      oldValue: !isActive,
      newValue: isActive,
      userId,
    },
  });

  cache = null; // Invalidate cache
  return updated as FeatureFlag;
}

export async function getFeatureFlagsByCategory(): Promise<
  Record<string, FeatureFlag[]>
> {
  const flags = await getAllFeatureFlags();
  return flags.reduce(
    (acc, flag) => {
      if (!acc[flag.category]) acc[flag.category] = [];
      acc[flag.category].push(flag);
      return acc;
    },
    {} as Record<string, FeatureFlag[]>
  );
}

export function invalidateFeatureFlagCache() {
  cache = null;
  cacheTime = 0;
}

export const FEATURE_CODES = {
  USER_MANAGEMENT: "FEAT_USER_MANAGEMENT",
  CLASS_SCHEDULE: "FEAT_CLASS_SCHEDULE",
  MATERIALS: "FEAT_MATERIALS",
  ASSIGNMENTS: "FEAT_ASSIGNMENTS",
  ONLINE_EXAM: "FEAT_ONLINE_EXAM",
  EXAM_BANK: "FEAT_EXAM_BANK",
  TRYOUT: "FEAT_TRYOUT",
  ATTENDANCE: "FEAT_ATTENDANCE",
  ATTENDANCE_QR: "FEAT_ATTENDANCE_QR",
  GRADES: "FEAT_GRADES",
  ANALYTICS: "FEAT_ANALYTICS",
  PAYMENT_MANUAL: "FEAT_PAYMENT_MANUAL",
  PAYMENT_ONLINE: "FEAT_PAYMENT_ONLINE",
  ANNOUNCEMENTS: "FEAT_ANNOUNCEMENTS",
  EMAIL_NOTIF: "FEAT_EMAIL_NOTIF",
  WHATSAPP_NOTIF: "FEAT_WHATSAPP_NOTIF",
  FORUM: "FEAT_FORUM",
  CHAT: "FEAT_CHAT",
  LIVE_CLASS: "FEAT_LIVE_CLASS",
  GAMIFICATION: "FEAT_GAMIFICATION",
  CERTIFICATE: "FEAT_CERTIFICATE",
  PARENT_PORTAL: "FEAT_PARENT_PORTAL",
  PWA: "FEAT_PWA",
} as const;
