import { db } from "@/lib/db";
import { generateCertificateNo, generateCertificateCode } from "@/lib/certificate";

/**
 * Check if a student has passed all exams in a class.
 * If so, issue an LMS_COMPLETION certificate (if not already issued).
 */
export async function checkAndIssueClassCompletionCertificate(
  studentId: string,
  classId: string
): Promise<{ issued: boolean; certificateId?: string; reason?: string }> {
  const cls = await db.class.findUnique({
    where: { id: classId },
    include: {
      exams: { where: { isPublished: true }, select: { id: true, passingScore: true } },
      subject: { select: { name: true } },
      program: { select: { name: true } },
    },
  });

  if (!cls) return { issued: false, reason: "Class not found" };
  if (cls.exams.length === 0) return { issued: false, reason: "No exams in class" };

  const examIds = cls.exams.map((e) => e.id);
  const bestAttempts = await db.examAttempt.findMany({
    where: { examId: { in: examIds }, studentId, isCompleted: true },
    orderBy: { score: "desc" },
    select: { examId: true, score: true },
    distinct: ["examId"],
  });

  const attemptMap = new Map(bestAttempts.map((a) => [a.examId, a.score]));
  for (const exam of cls.exams) {
    const bestScore = attemptMap.get(exam.id);
    if (bestScore === undefined || bestScore < exam.passingScore) {
      return { issued: false, reason: "Not all exams passed" };
    }
  }

  const existing = await db.certificate.findFirst({
    where: { userId: studentId, type: "LMS_COMPLETION", title: { contains: cls.name } },
  });
  if (existing) return { issued: false, reason: "Certificate already exists" };

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { name: true },
  });
  if (!student) return { issued: false, reason: "Student not found" };

  const activeTemplate = await db.certificateTemplate.findFirst({
    where: { type: "LMS_COMPLETION", isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const certificateNo = await generateCertificateNo();
  const code = await generateCertificateCode();
  const programName = cls.program?.name ?? cls.subject.name;

  const certificate = await db.certificate.create({
    data: {
      code,
      certificateNo,
      userId: studentId,
      type: "LMS_COMPLETION",
      title: `Sertifikat Kelulusan — ${cls.name}`,
      recipientName: student.name,
      templateId: activeTemplate?.id ?? null,
    },
  });

  return { issued: true, certificateId: certificate.id };
}
