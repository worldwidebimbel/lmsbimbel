import { db } from "@/lib/db";

export async function generateRegistrationNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WW-${year}-`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const result = await db.$transaction(async (tx) => {
      const latest = await tx.registration.findFirst({
        where: { registrationNo: { startsWith: prefix } },
        orderBy: { registrationNo: "desc" },
        select: { registrationNo: true },
      });

      let nextSeq = 1;
      if (latest) {
        const currentSeq = parseInt(latest.registrationNo.slice(prefix.length), 10);
        if (!isNaN(currentSeq)) nextSeq = currentSeq + 1;
      }

      if (attempt > 0) nextSeq += attempt;

      const registrationNo = `${prefix}${String(nextSeq).padStart(6, "0")}`;

      const existing = await tx.registration.findUnique({
        where: { registrationNo },
        select: { id: true },
      });

      if (existing) return null;

      return registrationNo;
    }, { isolationLevel: "Serializable" });

    if (result) return result;
  }

  const count = await db.registration.count({
    where: { registrationNo: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}
