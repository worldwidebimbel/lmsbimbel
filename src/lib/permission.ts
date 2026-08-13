import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

let cache: Map<string, Set<string>> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getRolePermissionsMap(): Promise<Map<string, Set<string>>> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) return cache;

  const rolePerms = await db.rolePermission.findMany({
    select: { role: true, permissionCode: true },
  });

  const map = new Map<string, Set<string>>();
  for (const rp of rolePerms) {
    const role = rp.role as string;
    if (!map.has(role)) map.set(role, new Set());
    map.get(role)!.add(rp.permissionCode);
  }

  // SUPER_ADMIN and ADMIN get all permissions implicitly
  const allPerms = await db.permission.findMany({ select: { code: true } });
  const allCodes = new Set(allPerms.map((p) => p.code));
  map.set("SUPER_ADMIN", allCodes);
  map.set("ADMIN", allCodes);

  cache = map;
  cacheTime = now;
  return map;
}

export async function hasPermission(
  role: string,
  permissionCode: string
): Promise<boolean> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const map = await getRolePermissionsMap();
  const perms = map.get(role);
  return perms?.has(permissionCode) ?? false;
}

export async function hasAnyPermission(
  role: string,
  permissionCodes: string[]
): Promise<boolean> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  const map = await getRolePermissionsMap();
  const perms = map.get(role);
  if (!perms) return false;
  return permissionCodes.some((code) => perms.has(code));
}

export async function requirePermission(
  role: string,
  permissionCode: string
): Promise<void> {
  const ok = await hasPermission(role, permissionCode);
  if (!ok) {
    throw new PermissionDeniedError(permissionCode);
  }
}

export async function getPermissionsForRole(
  role: string
): Promise<string[]> {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    const allPerms = await db.permission.findMany({ select: { code: true } });
    return allPerms.map((p) => p.code);
  }
  const map = await getRolePermissionsMap();
  const perms = map.get(role);
  return perms ? Array.from(perms) : [];
}

export function invalidatePermissionCache() {
  cache = null;
  cacheTime = 0;
}

export class PermissionDeniedError extends Error {
  constructor(public permissionCode: string) {
    super(`Permission denied: ${permissionCode}`);
    this.name = "PermissionDeniedError";
  }
}

// Permission code constants
export const PERM = {
  // User management
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",

  // Class & schedule
  CLASS_VIEW: "class.view",
  CLASS_CREATE: "class.create",
  CLASS_EDIT: "class.edit",
  CLASS_DELETE: "class.delete",
  SCHEDULE_MANAGE: "schedule.manage",

  // Finance
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  INVOICE_MANAGE: "invoice.manage",
  PAYMENT_MANAGE: "payment.manage",

  // PPDB
  PPDB_VIEW: "ppdb.view",
  PPDB_MANAGE: "ppdb.manage",

  // Affiliate
  AFFILIATE_VIEW: "affiliate.view",
  AFFILIATE_MANAGE: "affiliate.manage",

  // Academic
  ACADEMIC_VIEW: "academic.view",
  ACADEMIC_MANAGE: "academic.manage",
  GRADE_MANAGE: "grade.manage",

  // Branch
  BRANCH_VIEW: "branch.view",
  BRANCH_MANAGE: "branch.manage",

  // Events
  EVENT_VIEW: "event.view",
  EVENT_MANAGE: "event.manage",

  // CMS
  CMS_VIEW: "cms.view",
  CMS_MANAGE: "cms.manage",

  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",

  // Audit
  AUDIT_VIEW: "audit.view",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",
} as const;

// Default permission mappings per role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN_CABANG: [
    PERM.USER_VIEW, PERM.USER_CREATE, PERM.USER_EDIT,
    PERM.CLASS_VIEW, PERM.CLASS_CREATE, PERM.CLASS_EDIT, PERM.SCHEDULE_MANAGE,
    PERM.FINANCE_VIEW, PERM.INVOICE_MANAGE, PERM.PAYMENT_MANAGE,
    PERM.PPDB_VIEW, PERM.PPDB_MANAGE,
    PERM.ACADEMIC_VIEW, PERM.GRADE_MANAGE,
    PERM.EVENT_VIEW, PERM.EVENT_MANAGE,
    PERM.ANALYTICS_VIEW,
    PERM.CMS_VIEW,
  ],
  ADMIN_KEUANGAN: [
    PERM.FINANCE_VIEW, PERM.FINANCE_MANAGE,
    PERM.INVOICE_MANAGE, PERM.PAYMENT_MANAGE,
    PERM.AFFILIATE_VIEW, PERM.AFFILIATE_MANAGE,
    PERM.ANALYTICS_VIEW,
    PERM.USER_VIEW,
  ],
  ADMIN_AKADEMIK: [
    PERM.ACADEMIC_VIEW, PERM.ACADEMIC_MANAGE,
    PERM.CLASS_VIEW, PERM.CLASS_CREATE, PERM.CLASS_EDIT,
    PERM.SCHEDULE_MANAGE,
    PERM.GRADE_MANAGE,
    PERM.USER_VIEW,
    PERM.ANALYTICS_VIEW,
  ],
  GURU: [
    PERM.CLASS_VIEW, PERM.SCHEDULE_MANAGE,
    PERM.ACADEMIC_VIEW, PERM.GRADE_MANAGE,
  ],
  ORANG_TUA: [],
  AFILIATOR: [],
  SISWA: [],
};

// All permission definitions for seeding
export const ALL_PERMISSIONS = [
  { code: PERM.USER_VIEW, name: "Lihat Pengguna", module: "user" },
  { code: PERM.USER_CREATE, name: "Tambah Pengguna", module: "user" },
  { code: PERM.USER_EDIT, name: "Edit Pengguna", module: "user" },
  { code: PERM.USER_DELETE, name: "Hapus Pengguna", module: "user" },
  { code: PERM.CLASS_VIEW, name: "Lihat Kelas", module: "class" },
  { code: PERM.CLASS_CREATE, name: "Buat Kelas", module: "class" },
  { code: PERM.CLASS_EDIT, name: "Edit Kelas", module: "class" },
  { code: PERM.CLASS_DELETE, name: "Hapus Kelas", module: "class" },
  { code: PERM.SCHEDULE_MANAGE, name: "Kelola Jadwal", module: "schedule" },
  { code: PERM.FINANCE_VIEW, name: "Lihat Keuangan", module: "finance" },
  { code: PERM.FINANCE_MANAGE, name: "Kelola Keuangan", module: "finance" },
  { code: PERM.INVOICE_MANAGE, name: "Kelola Invoice", module: "finance" },
  { code: PERM.PAYMENT_MANAGE, name: "Kelola Pembayaran", module: "finance" },
  { code: PERM.PPDB_VIEW, name: "Lihat PPDB", module: "ppdb" },
  { code: PERM.PPDB_MANAGE, name: "Kelola PPDB", module: "ppdb" },
  { code: PERM.AFFILIATE_VIEW, name: "Lihat Afiliator", module: "affiliate" },
  { code: PERM.AFFILIATE_MANAGE, name: "Kelola Afiliator", module: "affiliate" },
  { code: PERM.ACADEMIC_VIEW, name: "Lihat Akademik", module: "academic" },
  { code: PERM.ACADEMIC_MANAGE, name: "Kelola Akademik", module: "academic" },
  { code: PERM.GRADE_MANAGE, name: "Kelola Nilai", module: "academic" },
  { code: PERM.BRANCH_VIEW, name: "Lihat Cabang", module: "branch" },
  { code: PERM.BRANCH_MANAGE, name: "Kelola Cabang", module: "branch" },
  { code: PERM.EVENT_VIEW, name: "Lihat Event", module: "event" },
  { code: PERM.EVENT_MANAGE, name: "Kelola Event", module: "event" },
  { code: PERM.CMS_VIEW, name: "Lihat CMS", module: "cms" },
  { code: PERM.CMS_MANAGE, name: "Kelola CMS", module: "cms" },
  { code: PERM.SETTINGS_VIEW, name: "Lihat Pengaturan", module: "settings" },
  { code: PERM.SETTINGS_MANAGE, name: "Kelola Pengaturan", module: "settings" },
  { code: PERM.AUDIT_VIEW, name: "Lihat Audit Log", module: "audit" },
  { code: PERM.ANALYTICS_VIEW, name: "Lihat Analitik", module: "analytics" },
];
