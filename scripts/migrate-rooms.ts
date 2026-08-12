import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("📦 Migrating room strings to Room entities...\n");

  const branches = await db.branch.findMany({
    select: { id: true, name: true, code: true },
  });

  let totalRoomsCreated = 0;
  let totalClassesMapped = 0;
  let totalSchedulesMapped = 0;
  const failures: { type: string; branchCode: string; roomValue: string }[] = [];

  for (const branch of branches) {
    console.log(`\n📍 Branch: ${branch.name} (${branch.code})`);

    let building = await db.building.findFirst({
      where: { branchId: branch.id, name: "Gedung Utama" },
    });
    if (!building) {
      building = await db.building.create({
        data: { branchId: branch.id, name: "Gedung Utama" },
      });
      console.log(`  ✓ Created default building "Gedung Utama"`);
    }

    const classRooms = await db.class.findMany({
      where: { branchId: branch.id, room: { not: null } },
      select: { id: true, room: true },
      distinct: ["room"],
    });

    const scheduleRooms = await db.schedule.findMany({
      where: { class: { branchId: branch.id }, room: { not: null } },
      select: { id: true, room: true },
      distinct: ["room"],
    });

    const uniqueRoomStrings = new Set<string>();
    classRooms.forEach((c) => c.room && uniqueRoomStrings.add(c.room));
    scheduleRooms.forEach((s) => s.room && uniqueRoomStrings.add(s.room));

    const roomMap = new Map<string, string>();

    for (const roomString of uniqueRoomStrings) {
      if (!roomString) continue;

      const existingRoom = await db.room.findFirst({
        where: { branchId: branch.id, name: roomString },
      });

      if (existingRoom) {
        roomMap.set(roomString, existingRoom.id);
        continue;
      }

      const newRoom = await db.room.create({
        data: {
          buildingId: building.id,
          branchId: branch.id,
          name: roomString,
          capacity: 30,
        },
      });
      roomMap.set(roomString, newRoom.id);
      totalRoomsCreated++;
    }
    console.log(`  ✓ ${roomMap.size} rooms processed`);

    const classesWithRoom = await db.class.findMany({
      where: { branchId: branch.id, room: { not: null }, roomId: null },
      select: { id: true, room: true },
    });

    for (const cls of classesWithRoom) {
      const roomId = cls.room ? roomMap.get(cls.room) : null;
      if (roomId) {
        await db.class.update({ where: { id: cls.id }, data: { roomId } });
        totalClassesMapped++;
      } else if (cls.room) {
        failures.push({ type: "Class", branchCode: branch.code, roomValue: cls.room });
      }
    }

    const schedulesWithRoom = await db.schedule.findMany({
      where: { class: { branchId: branch.id }, room: { not: null }, roomId: null },
      select: { id: true, room: true, classId: true },
    });

    for (const sched of schedulesWithRoom) {
      const roomId = sched.room ? roomMap.get(sched.room) : null;
      if (roomId) {
        const cls = await db.class.findUnique({
          where: { id: sched.classId },
          select: { teacherId: true },
        });
        await db.schedule.update({
          where: { id: sched.id },
          data: { roomId, teacherId: cls?.teacherId },
        });
        totalSchedulesMapped++;
      } else if (sched.room) {
        failures.push({ type: "Schedule", branchCode: branch.code, roomValue: sched.room });
      }
    }

    console.log(`  ✓ ${classesWithRoom.length} classes, ${schedulesWithRoom.length} schedules processed`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary:");
  console.log(`  Buildings created: ${branches.length > 0 ? "≥1 per branch" : 0}`);
  console.log(`  Rooms created: ${totalRoomsCreated}`);
  console.log(`  Classes mapped: ${totalClassesMapped}`);
  console.log(`  Schedules mapped: ${totalSchedulesMapped}`);

  if (failures.length > 0) {
    console.log(`\n⚠️  ${failures.length} failures:`);
    failures.forEach((f) => {
      console.log(`  - ${f.type} in ${f.branchCode}: room="${f.roomValue}" not mapped`);
    });
    console.log("\n⚠️  Review failures before running Migration 2 (drop room column).");
  } else {
    console.log("\n✅ All rooms mapped successfully! Safe to run Migration 2.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
