-- AddColumn: SiteBanner — titleHighlight, alignment, overlayOpacity
ALTER TABLE "site_banners" ADD COLUMN "titleHighlight" TEXT;
ALTER TABLE "site_banners" ADD COLUMN "alignment" TEXT NOT NULL DEFAULT 'left';
ALTER TABLE "site_banners" ADD COLUMN "overlayOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.4;

-- AddColumn: SiteProgram — subtitle, imageUrl, features, levelLabel, theme, imagePosition
ALTER TABLE "site_programs" ADD COLUMN "subtitle" TEXT;
ALTER TABLE "site_programs" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "site_programs" ADD COLUMN "features" JSONB;
ALTER TABLE "site_programs" ADD COLUMN "levelLabel" TEXT;
ALTER TABLE "site_programs" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'blue';
ALTER TABLE "site_programs" ADD COLUMN "imagePosition" TEXT NOT NULL DEFAULT 'left';

-- AddColumn: SiteTestimonial — photoUrl, rating, programName, isFeatured
ALTER TABLE "site_testimonials" ADD COLUMN "photoUrl" TEXT;
ALTER TABLE "site_testimonials" ADD COLUMN "rating" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "site_testimonials" ADD COLUMN "programName" TEXT;
ALTER TABLE "site_testimonials" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: SiteSocialLink
CREATE TABLE "site_social_links" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SiteMenu
CREATE TABLE "site_menus" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SiteQuickAction
CREATE TABLE "site_quick_actions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'blue',
    "linkUrl" TEXT,
    "fileUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_quick_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SiteVideo
CREATE TABLE "site_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Umum',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SiteVideoHighlight
CREATE TABLE "site_video_highlights" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'blue',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_video_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_menus_parentId_idx" ON "site_menus"("parentId");

-- AddForeignKey: SiteMenu self-reference
ALTER TABLE "site_menus" ADD CONSTRAINT "site_menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "site_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
