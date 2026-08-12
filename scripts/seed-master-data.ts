import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding education levels...");
  const levels = [
    { name: "PAUD", code: "PAUD", order: 1 },
    { name: "Sekolah Dasar", code: "SD", order: 2 },
    { name: "Sekolah Menengah Pertama", code: "SMP", order: 3 },
    { name: "Sekolah Menengah Atas", code: "SMA", order: 4 },
  ];

  for (const level of levels) {
    await db.educationLevel.upsert({
      where: { code: level.code },
      update: {},
      create: level,
    });
  }
  console.log(`  ✓ ${levels.length} education levels`);

  console.log("🌱 Seeding programs from SiteProgram...");
  const sitePrograms = await db.siteProgram.findMany({
    orderBy: { order: "asc" },
  });

  const allBranches = await db.branch.findMany({ select: { id: true } });
  const allLevels = await db.educationLevel.findMany({ select: { id: true } });

  let created = 0;
  for (const sp of sitePrograms) {
    const slug = sp.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await db.program.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  ↳ Skip "${sp.title}" (slug already exists)`);
      continue;
    }

    await db.program.create({
      data: {
        slug,
        name: sp.title,
        description: sp.description || null,
        isActive: sp.isActive,
        order: sp.order,
        price: 0,
        branches: { connect: allBranches.map((b) => ({ id: b.id })) },
        educationLevels: { connect: allLevels.map((l) => ({ id: l.id })) },
      },
    });
    created++;
  }
  console.log(`  ✓ ${created} programs created from SiteProgram`);

  console.log("🌱 Seeding transaction categories...");
  const categories = [
    { name: "Pendapatan SPP", code: "INCOME_SPP", type: "INCOME", order: 1 },
    { name: "Pendapatan Pendaftaran", code: "INCOME_REGIST", type: "INCOME", order: 2 },
    { name: "Pendapatan Event", code: "INCOME_EVENT", type: "INCOME", order: 3 },
    { name: "Pendapatan Lainnya", code: "INCOME_OTHER", type: "INCOME", order: 99 },
    { name: "Gaji Tutor", code: "EXPENSE_SALARY", type: "EXPENSE", order: 1 },
    { name: "Sewa Tempat", code: "EXPENSE_RENT", type: "EXPENSE", order: 2 },
    { name: "Operasional", code: "EXPENSE_OPS", type: "EXPENSE", order: 3 },
    { name: "Pengeluaran Lainnya", code: "EXPENSE_OTHER", type: "EXPENSE", order: 99 },
  ];

  for (const cat of categories) {
    await db.transactionCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat as never,
    });
  }
  console.log(`  ✓ ${categories.length} transaction categories`);

  console.log("🌱 Seeding academic year...");
  const existingYear = await db.academicYear.findFirst();
  if (!existingYear) {
    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    await db.academicYear.create({
      data: {
        name: `${startYear}/${startYear + 1}`,
        startDate: new Date(`${startYear}-07-01`),
        endDate: new Date(`${startYear + 1}-06-30`),
        isActive: true,
      },
    });
    console.log("  ✓ Academic year created");
  } else {
    console.log("  ↳ Skip (academic year already exists)");
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
