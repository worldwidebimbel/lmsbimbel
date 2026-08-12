import { db } from "@/lib/db";

/**
 * Update student status based on overdue invoices.
 * - If student has any OVERDUE invoice → set status to TUNGGAKAN
 * - If no OVERDUE invoices → set status back to AKTIF (if currently TUNGGAKAN)
 *
 * Call this after invoice status changes (create, confirm payment, reject, etc.)
 * or from a scheduled cron job.
 */
export async function updateStudentStatus(studentId: string): Promise<void> {
  try {
    const overdueCount = await db.invoice.count({
      where: {
        studentId,
        status: "OVERDUE",
      },
    });

    const profile = await db.userProfile.findUnique({
      where: { userId: studentId },
      select: { id: true, studentStatus: true },
    });

    if (!profile) return;

    const newStatus = overdueCount > 0 ? "TUNGGAKAN" : "AKTIF";

    if (profile.studentStatus !== newStatus) {
      await db.userProfile.update({
        where: { userId: studentId },
        data: { studentStatus: newStatus as never },
      });
    }
  } catch {
    // Should not break main operation
  }
}

/**
 * Batch update student statuses — useful for cron jobs.
 * Finds all students with OVERDUE invoices and sets their status to TUNGGAKAN.
 * Also resets students who no longer have OVERDUE invoices back to AKTIF.
 */
export async function batchUpdateStudentStatuses(): Promise<{
  setToTunggakan: number;
  setToAktif: number;
}> {
  try {
    const studentsWithOverdue = await db.invoice.findMany({
      where: { status: "OVERDUE" },
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const overdueStudentIds = studentsWithOverdue.map((s) => s.studentId);

    const [setToTunggakan] = await Promise.all([
      overdueStudentIds.length > 0
        ? db.userProfile.updateMany({
            where: {
              userId: { in: overdueStudentIds },
              studentStatus: { not: "TUNGGAKAN" as never },
            },
            data: { studentStatus: "TUNGGAKAN" as never },
          })
        : { count: 0 },
      db.userProfile.updateMany({
        where: {
          userId: { notIn: overdueStudentIds },
          studentStatus: "TUNGGAKAN" as never,
        },
        data: { studentStatus: "AKTIF" as never },
      }),
    ]);

    return {
      setToTunggakan: setToTunggakan.count,
      setToAktif: 0,
    };
  } catch {
    return { setToTunggakan: 0, setToAktif: 0 };
  }
}
