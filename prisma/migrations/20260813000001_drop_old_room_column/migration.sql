-- DropOldRoomColumn
-- Item 1.2: Drop old text column "room" from schedules and classes, replaced by roomId relation

ALTER TABLE "schedules" DROP COLUMN IF EXISTS "room";
ALTER TABLE "classes" DROP COLUMN IF EXISTS "room";
