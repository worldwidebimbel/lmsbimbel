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

export async function getAdminIdsForBranch(branchId: string | null): Promise<string[]> {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      ...(branchId
        ? {
            OR: [
              { defaultBranchId: branchId },
              { role: "SUPER_ADMIN" },
            ],
          }
        : {}),
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function canChatWith(
  user: { id: string; role: string },
  receiverId: string,
  branchId?: string | null
): Promise<boolean> {
  const { role, id } = user;
  if (receiverId === id) return false;

  if (role === "SUPER_ADMIN") return true;
  if (role === "ADMIN") {
    if (!branchId) return false;
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: { defaultBranchId: true, role: true },
    });
    if (!receiver) return false;
    return receiver.defaultBranchId === branchId || receiver.role === "ADMIN" || receiver.role === "SUPER_ADMIN";
  }

  if (role === "GURU") {
    const shared = await db.classStudent.findFirst({
      where: { studentId: receiverId, class: { teacherId: id, isActive: true } },
    });
    return !!shared;
  }

  if (role === "SISWA") {
    const shared = await db.classStudent.findFirst({
      where: { studentId: id, class: { teacherId: receiverId, isActive: true } },
    });
    return !!shared;
  }

  if (role === "ORANG_TUA") {
    const children = await db.parentChild.findMany({
      where: { parentId: id },
      select: { childId: true },
    });
    const childIds = children.map((c) => c.childId);
    if (childIds.length === 0) return false;
    const shared = await db.classStudent.findFirst({
      where: { studentId: { in: childIds }, class: { teacherId: receiverId, isActive: true } },
    });
    return !!shared;
  }

  return false;
}

export async function getAllowedClassIds(user: { id: string; role: string }, branchId?: string | null): Promise<string[]> {
  const { role, id } = user;

  if (role === "SUPER_ADMIN") {
    if (branchId) {
      const classes = await db.class.findMany({
        where: { branchId, isActive: true },
        select: { id: true },
      });
      return classes.map((c) => c.id);
    }
    const classes = await db.class.findMany({ where: { isActive: true }, select: { id: true } });
    return classes.map((c) => c.id);
  }

  if (role === "ADMIN") {
    if (branchId) {
      const classes = await db.class.findMany({
        where: { branchId, isActive: true },
        select: { id: true },
      });
      return classes.map((c) => c.id);
    }
    return [];
  }

  if (role === "GURU") {
    const classes = await db.class.findMany({
      where: { teacherId: id, isActive: true },
      select: { id: true },
    });
    return classes.map((c) => c.id);
  }

  if (role === "SISWA") {
    const enrolled = await db.classStudent.findMany({
      where: { studentId: id, class: { isActive: true } },
      select: { classId: true },
    });
    return enrolled.map((e) => e.classId);
  }

  if (role === "ORANG_TUA") {
    const children = await db.parentChild.findMany({
      where: { parentId: id },
      select: { childId: true },
    });
    const childIds = children.map((c) => c.childId);
    const enrolled = await db.classStudent.findMany({
      where: { studentId: { in: childIds }, class: { isActive: true } },
      select: { classId: true },
    });
    return enrolled.map((e) => e.classId);
  }

  return [];
}
