import { db } from "@/lib/db";

export type FraudCheckResult = {
  isFraud: boolean;
  reasons: string[];
};

/**
 * Check for self-referral: affiliate's email/WA matches the registrant's.
 */
export async function checkSelfReferral(params: {
  affiliateId: string;
  email?: string;
  whatsapp?: string;
  nik?: string;
}): Promise<boolean> {
  const affiliate = await db.affiliate.findUnique({
    where: { id: params.affiliateId },
    select: {
      email: true,
      whatsapp: true,
      user: {
        select: {
          email: true,
          profile: { select: { nik: true, phone: true } },
        },
      },
    },
  });

  if (!affiliate) return false;

  const affiliateEmails = [
    affiliate.email,
    affiliate.user?.email,
  ].filter(Boolean) as string[];

  const affiliatePhones = [
    affiliate.whatsapp,
    affiliate.user?.profile?.phone,
  ].filter(Boolean) as string[];

  const affiliateNiks = [
    affiliate.user?.profile?.nik,
  ].filter(Boolean) as string[];

  if (params.email && affiliateEmails.some((e) => e.toLowerCase() === params.email!.toLowerCase())) {
    return true;
  }

  if (params.whatsapp && affiliatePhones.some((p) => normalizePhone(p) === normalizePhone(params.whatsapp!))) {
    return true;
  }

  if (params.nik && affiliateNiks.some((n) => n === params.nik)) {
    return true;
  }

  return false;
}

/**
 * Check if registrant's NIK/WA/email already exists in a previous registration.
 */
export async function checkDuplicateRegistrant(params: {
  email?: string;
  whatsapp?: string;
  nik?: string;
}): Promise<boolean> {
  const or: Record<string, unknown>[] = [];

  if (params.email) {
    or.push({ email: params.email.toLowerCase() });
  }
  if (params.whatsapp) {
    or.push({ whatsapp: normalizePhone(params.whatsapp) });
  }
  if (params.nik) {
    or.push({ nik: params.nik });
  }

  if (or.length === 0) return false;

  const existing = await db.registration.findFirst({
    where: { OR: or },
    select: { id: true },
  });

  return !!existing;
}

/**
 * Check if a referral already exists for this affiliate + registration.
 */
export async function checkDuplicateReferral(
  affiliateId: string,
  registrationId: string
): Promise<boolean> {
  const existing = await db.referral.findFirst({
    where: { affiliateId, registrationId },
    select: { id: true },
  });

  return !!existing;
}

/**
 * Run all fraud checks and return aggregated result.
 */
export async function runFraudChecks(params: {
  affiliateId: string;
  registrationId: string;
  email?: string;
  whatsapp?: string;
  nik?: string;
}): Promise<FraudCheckResult> {
  const reasons: string[] = [];

  const isSelf = await checkSelfReferral({
    affiliateId: params.affiliateId,
    email: params.email,
    whatsapp: params.whatsapp,
    nik: params.nik,
  });

  if (isSelf) {
    reasons.push("Self-referral: data afiliator sama dengan pendaftar");
  }

  const isDuplicate = await checkDuplicateReferral(
    params.affiliateId,
    params.registrationId
  );

  if (isDuplicate) {
    reasons.push("Duplikasi: referral sudah ada untuk pendaftaran ini");
  }

  const isDuplicateRegistrant = await checkDuplicateRegistrant({
    email: params.email,
    whatsapp: params.whatsapp,
    nik: params.nik,
  });

  if (isDuplicateRegistrant) {
    reasons.push("Duplikasi akun: NIK/WA/email pendaftar sudah pernah terdaftar");
  }

  return {
    isFraud: reasons.length > 0,
    reasons,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-+()]/g, "");
}
