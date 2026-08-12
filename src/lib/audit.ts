import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type AuditParams = {
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export async function logAudit({
  action,
  entity,
  entityId,
  before,
  after,
}: AuditParams): Promise<void> {
  try {
    const session = await auth();
    const headerList = await headers();
    const ipAddress =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      null;
    const userAgent = headerList.get("user-agent") || null;

    await db.auditLog.create({
      data: {
        actorId: session?.user?.id ?? null,
        actorName: session?.user?.name ?? "System",
        action,
        entity,
        entityId,
        before: before ? (before as object) : undefined,
        after: after ? (after as object) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch {
    // Audit log failure should never break the main operation
  }
}

export async function getAuditLogs(params: {
  entity?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const {
    entity,
    actorId,
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
  } = params;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (actorId) where.actorId = actorId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
