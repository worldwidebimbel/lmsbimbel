-- CreateEnum
CREATE TYPE "RubricType" AS ENUM ('ACADEMIC', 'ATTITUDE');

-- AlterTable
ALTER TABLE "raports" ADD COLUMN "academicStars" INTEGER;
ALTER TABLE "raports" ADD COLUMN "academicCategory" TEXT;
ALTER TABLE "raports" ADD COLUMN "academicDescription" TEXT;
ALTER TABLE "raports" ADD COLUMN "attitudeStars" INTEGER;
ALTER TABLE "raports" ADD COLUMN "attitudeCategory" TEXT;
ALTER TABLE "raports" ADD COLUMN "attitudeDescription" TEXT;
ALTER TABLE "raports" ADD COLUMN "attitudeNote" TEXT;

-- CreateTable
CREATE TABLE "rubric_levels" (
    "id" TEXT NOT NULL,
    "type" "RubricType" NOT NULL DEFAULT 'ACADEMIC',
    "stars" INTEGER NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "colorHex" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rubric_levels_type_idx" ON "rubric_levels"("type");

-- CreateIndex
CREATE UNIQUE INDEX "rubric_levels_type_stars_key" ON "rubric_levels"("type", "stars");

-- CreateTable
CREATE TABLE "attitude_aspects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attitude_aspects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raport_attitudes" (
    "id" TEXT NOT NULL,
    "raportId" TEXT NOT NULL,
    "aspectId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raport_attitudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raport_attitudes_raportId_idx" ON "raport_attitudes"("raportId");

-- CreateIndex
CREATE INDEX "raport_attitudes_aspectId_idx" ON "raport_attitudes"("aspectId");

-- CreateIndex
CREATE UNIQUE INDEX "raport_attitudes_raportId_aspectId_key" ON "raport_attitudes"("raportId", "aspectId");

-- AddForeignKey
ALTER TABLE "raport_attitudes" ADD CONSTRAINT "raport_attitudes_raportId_fkey"
  FOREIGN KEY ("raportId") REFERENCES "raports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raport_attitudes" ADD CONSTRAINT "raport_attitudes_aspectId_fkey"
  FOREIGN KEY ("aspectId") REFERENCES "attitude_aspects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
