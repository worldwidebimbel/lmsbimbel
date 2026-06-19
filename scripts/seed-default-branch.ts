import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // 1. Create default branch if not exists
  let defaultBranch = await db.branch.findFirst({ where: { isDefault: true } });
  if (!defaultBranch) {
    defaultBranch = await db.branch.create({
      data: {
        code: "MAIN",
        name: "Cabang Utama",
        address: "Alamat utama bimbel",
        isActive: true,
        isDefault: true,
      },
    });
    console.log("Created default branch:", defaultBranch.id);
  } else {
    console.log("Default branch already exists:", defaultBranch.id);
  }

  // 2. Assign users without defaultBranchId
  const usersToUpdate = await db.user.findMany({
    where: { defaultBranchId: null },
    select: { id: true },
  });
  if (usersToUpdate.length > 0) {
    await db.user.updateMany({
      where: { defaultBranchId: null },
      data: { defaultBranchId: defaultBranch.id },
    });
    console.log(`Assigned defaultBranchId to ${usersToUpdate.length} users`);
  }

  // 3. Assign classes without branchId
  const classesToUpdate = await db.class.findMany({
    where: { branchId: null },
    select: { id: true },
  });
  if (classesToUpdate.length > 0) {
    await db.class.updateMany({
      where: { branchId: null },
      data: { branchId: defaultBranch.id },
    });
    console.log(`Assigned branchId to ${classesToUpdate.length} classes`);
  }

  // 4. Assign invoices without branchId (derive from student default branch)
  const invoicesToUpdate = await db.invoice.findMany({
    where: { branchId: null },
    include: { student: { select: { defaultBranchId: true } } },
  });
  for (const inv of invoicesToUpdate) {
    await db.invoice.update({
      where: { id: inv.id },
      data: { branchId: inv.student.defaultBranchId ?? defaultBranch.id },
    });
  }
  if (invoicesToUpdate.length > 0) {
    console.log(`Assigned branchId to ${invoicesToUpdate.length} invoices`);
  }

  console.log("Default branch migration completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
