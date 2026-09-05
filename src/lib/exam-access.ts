import { db } from "@/lib/db";

export async function canStudentAccessExam(
  exam: { id: string; classId: string | null; eventId: string | null },
  studentId: string
): Promise<boolean> {
  if (exam.classId) {
    const enrolled = await db.classStudent.findUnique({
      where: { classId_studentId: { classId: exam.classId, studentId } },
    });
    return !!enrolled;
  }

  if (exam.eventId) {
    const reg = await db.eventRegistration.findFirst({
      where: {
        eventId: exam.eventId,
        userId: studentId,
        paymentStatus: { in: ["PAID", "FREE"] },
      },
    });
    return !!reg;
  }

  return true;
}
