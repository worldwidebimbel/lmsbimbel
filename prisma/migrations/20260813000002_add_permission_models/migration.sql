-- AddPermissionModels
-- Tahap 4.1: Add Permission and RolePermission models

-- CreateEnum for new roles (ALTER TYPE ADD VALUE)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN_CABANG';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN_KEUANGAN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN_AKADEMIK';

-- CreateTable: Permission
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_code_key" ON "permissions"("code");

-- CreateTable: RolePermission
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permissionCode_key" ON "role_permissions"("role", "permissionCode");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionCode_fkey"
    FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE CASCADE;
