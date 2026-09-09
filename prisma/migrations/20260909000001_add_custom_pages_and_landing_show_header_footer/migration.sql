-- AlterTable: add showHeader & showFooter to landing_pages
ALTER TABLE "landing_pages" ADD COLUMN "showHeader" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "landing_pages" ADD COLUMN "showFooter" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: custom_pages
CREATE TABLE "custom_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "showHeader" BOOLEAN NOT NULL DEFAULT true,
    "showFooter" BOOLEAN NOT NULL DEFAULT true,
    "metaTitle" TEXT,
    "metaDesc" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_pages_slug_key" ON "custom_pages"("slug");
