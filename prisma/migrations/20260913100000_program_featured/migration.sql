-- AlterTable: add featured flag to site_programs
ALTER TABLE "site_programs" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
