import { db } from "@/lib/db";

const QRIS_KEYS = [
  "qris_image_url",
  "qris_bank_name",
  "qris_account_name",
  "qris_account_number",
] as const;

export type QrisSettings = {
  imageUrl: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
};

export function getBranchQrisKey(baseKey: string, branchId: string | null) {
  return branchId ? `${baseKey}_${branchId}` : baseKey;
}

export async function getQrisSettings(branchId: string | null): Promise<QrisSettings> {
  const defaultKeys = QRIS_KEYS.map((k) => k);
  const branchKeys = branchId ? QRIS_KEYS.map((k) => getBranchQrisKey(k, branchId)) : [];
  const allKeys = [...defaultKeys, ...branchKeys];

  const rows = await db.appSetting.findMany({
    where: { key: { in: allKeys } },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    imageUrl: (branchId && map[getBranchQrisKey("qris_image_url", branchId)]) || map["qris_image_url"] || null,
    bankName: (branchId && map[getBranchQrisKey("qris_bank_name", branchId)]) || map["qris_bank_name"] || null,
    accountName: (branchId && map[getBranchQrisKey("qris_account_name", branchId)]) || map["qris_account_name"] || null,
    accountNumber: (branchId && map[getBranchQrisKey("qris_account_number", branchId)]) || map["qris_account_number"] || null,
  };
}
