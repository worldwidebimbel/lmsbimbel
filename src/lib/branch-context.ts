import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export type BranchScope = {
  branchId: string | null;
  isSuperAdmin: boolean;
  allBranches: { id: string; name: string; code: string }[];
};

export async function getBranchScope(): Promise<BranchScope> {
  const session = await auth();
  if (!session?.user) {
    return { branchId: null, isSuperAdmin: false, allBranches: [] };
  }

  const role = session.user.role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const allBranches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  // Super admin can access all; other roles limited to their default branch
  const branchId = isSuperAdmin ? null : session.user.defaultBranchId;

  return { branchId, isSuperAdmin, allBranches };
}

export function addBranchFilter<T extends Record<string, unknown>>(
  where: T,
  branchId: string | null,
  fieldName: "branchId" | "id" = "branchId"
): T {
  if (!branchId) return where;
  return { ...where, [fieldName]: branchId } as T;
}

export function branchWhere(branchId: string | null): Prisma.ClassWhereInput | Prisma.InvoiceWhereInput {
  return branchId ? { branchId } : {};
}
