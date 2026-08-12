import { db } from "@/lib/db";

/**
 * Generate a unique affiliate code from a name.
 * Format: WW-{NAME}{NN} e.g. WW-JUNAIDI01, WW-BUDI02
 */
export async function generateAffiliateCode(name: string): Promise<string> {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 12);

  if (!base) {
    return `WW-AFFILIATE${Date.now().toString(36).toUpperCase()}`;
  }

  const prefix = `WW-${base}`;

  // Find existing codes with the same base
  const existing = await db.affiliate.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  });

  if (existing.length === 0) {
    return `${prefix}01`;
  }

  // Find the highest suffix
  let maxSuffix = 0;
  for (const a of existing) {
    const suffix = parseInt(a.code.slice(prefix.length), 10);
    if (!isNaN(suffix) && suffix > maxSuffix) maxSuffix = suffix;
  }

  return `${prefix}${String(maxSuffix + 1).padStart(2, "0")}`;
}

/**
 * Validate that an affiliate code exists and is active.
 */
export async function validateAffiliateCode(code: string): Promise<{
  valid: boolean;
  affiliateId?: string;
}> {
  const affiliate = await db.affiliate.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, isActive: true },
  });

  if (!affiliate || !affiliate.isActive) {
    return { valid: false };
  }

  return { valid: true, affiliateId: affiliate.id };
}
