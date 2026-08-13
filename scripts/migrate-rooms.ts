// This script is deprecated — the old `room` text column has been dropped.
// Room data is now managed via the `roomId` foreign key relation.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("⚠️  This migration script is deprecated.");
  console.log("The old 'room' text column has been dropped from schema.");
  console.log("Room data is now managed via roomId foreign key.\n");

  const roomCount = await db.room.count();
  console.log(`Current Room entities in database: ${roomCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
