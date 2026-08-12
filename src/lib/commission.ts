import { db } from "@/lib/db";
import { runFraudChecks } from "@/lib/affiliate-fraud";
import { notifyAfiliatorReferral, notifyAfiliatorCommission } from "@/lib/afiliator-notifications";

/**
 * Resolve the best commission rule for a given program and stage.
 * Priority: per_program > percentage > nominal (by priority field descending).
 */
export async function resolveCommissionRule(
  programId: string,
  stage?: string
) {
  const rules = await db.commissionRule.findMany({
    where: {
      isActive: true,
      OR: [
        { programId },
        { programId: null },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });

  // Filter by stage if provided
  const stageMatch = stage
    ? rules.filter((r) => r.stage === stage || r.stage === null)
    : rules;

  // Prefer per-program rules, then percentage, then nominal
  const perProgram = stageMatch.find((r) => r.type === "PER_PROGRAM" && r.programId === programId);
  if (perProgram) return perProgram;

  const percentage = stageMatch.find((r) => r.type === "PERCENTAGE");
  if (percentage) return percentage;

  const nominal = stageMatch.find((r) => r.type === "NOMINAL");
  if (nominal) return nominal;

  const tiered = stageMatch.find((r) => r.type === "TIERED");
  if (tiered) return tiered;

  return null;
}

/**
 * Calculate commission amount based on rule type and transaction value.
 */
export function calculateCommission(
  rule: { type: string; nominal: number | null; percentage: number | null },
  transactionValue: number
): number {
  switch (rule.type) {
    case "NOMINAL":
      return rule.nominal ?? 0;
    case "PERCENTAGE":
    case "PER_PROGRAM":
      return Math.round((transactionValue * (rule.percentage ?? 0)) / 100);
    case "TIERED":
      // Tiered uses nominal as fallback; full tier logic can be expanded later
      return rule.nominal ?? 0;
    default:
      return 0;
  }
}

/**
 * Create a referral record when a PPDB registration includes a referral code.
 * Called from the PPDB register API.
 */
export async function createReferral(params: {
  affiliateCode: string;
  registrationId: string;
  programId?: string;
  email?: string;
  whatsapp?: string;
  nik?: string;
}): Promise<{ created: boolean; fraudFlag: boolean; fraudReasons: string[] }> {
  const affiliate = await db.affiliate.findUnique({
    where: { code: params.affiliateCode.toUpperCase() },
    select: { id: true, isActive: true },
  });

  if (!affiliate || !affiliate.isActive) {
    return { created: false, fraudFlag: false, fraudReasons: [] };
  }

  const fraudResult = await runFraudChecks({
    affiliateId: affiliate.id,
    registrationId: params.registrationId,
    email: params.email,
    whatsapp: params.whatsapp,
    nik: params.nik,
  });

  const referral = await db.referral.create({
    data: {
      affiliateId: affiliate.id,
      registrationId: params.registrationId,
      programId: params.programId ?? null,
      status: "PENDING",
      fraudFlag: fraudResult.isFraud,
      fraudReason: fraudResult.isFraud ? fraudResult.reasons.join("; ") : null,
    },
  });

  // Create initial commission record if a rule exists
  if (params.programId) {
    const rule = await resolveCommissionRule(params.programId, "REGISTRATION");
    if (rule) {
      const program = await db.program.findUnique({
        where: { id: params.programId },
        select: { price: true, name: true },
      });
      const amount = calculateCommission(rule, program?.price ?? 0);

      await db.commission.create({
        data: {
          referralId: referral.id,
          ruleId: rule.id,
          amount,
          status: "PENDING",
        },
      });

      // Notify afiliator of new referral
      const registration = await db.registration.findUnique({
        where: { id: params.registrationId },
        select: { fullName: true, registrationNo: true },
      });
      if (registration) {
        await notifyAfiliatorReferral({
          affiliateId: affiliate.id,
          registrationNo: registration.registrationNo,
          studentName: registration.fullName,
          programName: program?.name,
        }).catch((err) => console.error("[Commission] notifyAfiliatorReferral failed:", err));
      }
    }
  }

  return {
    created: true,
    fraudFlag: fraudResult.isFraud,
    fraudReasons: fraudResult.reasons,
  };
}

/**
 * Advance commission status when PPDB status or payment status changes.
 * Commission becomes VALID only after payment is verified.
 */
export async function advanceCommissionStatus(params: {
  registrationId: string;
  trigger: "REGISTRATION_VERIFIED" | "PAYMENT_VERIFIED" | "CONVERTED" | "CANCELLED";
}): Promise<void> {
  const referral = await db.referral.findFirst({
    where: { registrationId: params.registrationId },
    include: { commissions: true, registration: { select: { fullName: true, registrationNo: true } } },
  });

  if (!referral) return;

  const statusMap: Record<string, typeof referral.status> = {
    REGISTRATION_VERIFIED: "REGISTRATION_VERIFIED",
    PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
    CONVERTED: "VALID",
    CANCELLED: "CANCELLED",
  };

  const newStatus = statusMap[params.trigger];
  if (!newStatus) return;

  // Don't downgrade status
  const statusOrder = ["PENDING", "REGISTRATION_VERIFIED", "PAYMENT_VERIFIED", "VALID", "READY_PAYOUT", "PAID"];
  const currentIdx = statusOrder.indexOf(referral.status);
  const newIdx = statusOrder.indexOf(newStatus);

  if (params.trigger === "CANCELLED") {
    await db.referral.update({
      where: { id: referral.id },
      data: { status: "CANCELLED" },
    });
    await db.commission.updateMany({
      where: { referralId: referral.id },
      data: { status: "CANCELLED", cancelledReason: "Referral dibatalkan" },
    });
    // Notify afiliator of cancellation
    const studentName = referral.registration?.fullName ?? "Pendaftar";
    for (const c of referral.commissions) {
      await notifyAfiliatorCommission({
        affiliateId: referral.affiliateId,
        amount: c.amount,
        studentName,
        status: "CANCELLED",
      });
    }
    return;
  }

  if (newIdx <= currentIdx) return;

  await db.referral.update({
    where: { id: referral.id },
    data: { status: newStatus },
  });

  // Update commission statuses to match
  if (newStatus === "VALID") {
    await db.commission.updateMany({
      where: { referralId: referral.id, status: { notIn: ["CANCELLED", "PAID"] } },
      data: { status: "VALID", validatedAt: new Date() },
    });
  } else {
    await db.commission.updateMany({
      where: { referralId: referral.id, status: { notIn: ["CANCELLED", "PAID"] } },
      data: { status: newStatus },
    });
  }

  // Notify afiliator of commission status change
  const studentName = referral.registration?.fullName ?? "Pendaftar";
  for (const c of referral.commissions) {
    if (c.status === "CANCELLED" || c.status === "PAID") continue;
    await notifyAfiliatorCommission({
      affiliateId: referral.affiliateId,
      amount: c.amount,
      studentName,
      status: newStatus,
    });
  }
}

/**
 * Mark commissions as READY_PAYOUT (called manually by admin or cron).
 */
export async function markReadyPayout(affiliateId: string): Promise<void> {
  await db.commission.updateMany({
    where: {
      referral: { affiliateId },
      status: "VALID",
    },
    data: { status: "READY_PAYOUT" },
  });

  await db.referral.updateMany({
    where: {
      affiliateId,
      status: "VALID",
    },
    data: { status: "READY_PAYOUT" },
  });
}
