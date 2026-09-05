import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { optionText } from "@/lib/question-options";
import { checkAndIssueClassCompletionCertificate } from "@/lib/certificate-trigger";
import { canStudentAccessExam } from "@/lib/exam-access";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exam = await db.exam.findUnique({
    where: { id, isPublished: true },
    include: {
      class: { select: { name: true, subject: { select: { name: true, color: true } } } },
      questions: {
        select: { id: true, type: true, content: true, imageUrl: true, audioUrl: true, videoUrl: true, options: true, score: true, groupId: true, sectionId: true, order: true },
        orderBy: { order: "asc" },
      },
      sections: { orderBy: { order: "asc" } },
      questionGroups: { orderBy: { order: "asc" } },
      attempts: {
        where: { studentId: session.user.id },
        select: { id: true, score: true, isCompleted: true, submittedAt: true, answers: true, attemptNumber: true },
        orderBy: { attemptNumber: "desc" },
      },
    },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canAccess = await canStudentAccessExam(exam, session.user.id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check max attempts
  const completedCount = exam.attempts.filter((a) => a.isCompleted).length;
  const hasActiveAttempt = exam.attempts.some((a) => !a.isCompleted);

  if (exam.isRandomized) {
    exam.questions = exam.questions.sort(() => Math.random() - 0.5);
  }

  if (exam.shuffleOptions) {
    exam.questions = exam.questions.map((q) => {
      if (q.type === "PILGAN" && q.options) {
        const opts = q.options as string[];
        const shuffled = [...opts].sort(() => Math.random() - 0.5);
        return { ...q, options: shuffled };
      }
      return q;
    });
  }

  return NextResponse.json({ ...exam, maxAttemptsReached: completedCount >= exam.maxAttempts, hasActiveAttempt });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { answers } = body;

  const exam = await db.exam.findUnique({
    where: { id, isPublished: true },
    include: { questions: true },
  });

  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canAccess = await canStudentAccessExam(exam, session.user.id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  if (exam.startTime && new Date(exam.startTime) > now) {
    return NextResponse.json({ error: "Ujian belum dimulai" }, { status: 403 });
  }
  if (exam.endTime && new Date(exam.endTime) < now) {
    return NextResponse.json({ error: "Waktu ujian sudah berakhir" }, { status: 403 });
  }

  // Check max attempts
  const completedAttempts = await db.examAttempt.count({
    where: { examId: id, studentId: session.user.id, isCompleted: true },
  });
  if (completedAttempts >= exam.maxAttempts) {
    return NextResponse.json({ error: `Maksimal ${exam.maxAttempts} percobaan tercapai` }, { status: 403 });
  }

  let totalScore = 0;
  let maxScore = 0;

  for (const q of exam.questions) {
    maxScore += q.score;
    const studentAnswer: string | undefined = answers?.[q.id];
    if (!studentAnswer) continue;

    switch (q.type) {
      case "PILGAN":
      case "BENAR_SALAH":
      case "ISIAN":
        if (studentAnswer === q.correctAnswer) totalScore += q.score;
        break;

      case "MENGURUTKAN": {
        if (!q.correctAnswer) break;
        const correctOrder = q.correctAnswer.split(",");
        const studentOrder = studentAnswer.split(",");
        if (correctOrder.join(",") === studentOrder.join(",")) totalScore += q.score;
        break;
      }

      case "PILGAN_KOMPLEK": {
        if (!q.correctAnswer) break;
        const sortStudent = studentAnswer.split("|").sort().join("|");
        const sortCorrect = q.correctAnswer.split("|").sort().join("|");
        if (sortStudent === sortCorrect) totalScore += q.score;
        break;
      }

      case "MENJODOHKAN": {
        const opts = q.options as { left: string; right: string }[] | null;
        if (!opts?.length) break;
        const studentMap = Object.fromEntries(
          studentAnswer.split(",").map((p) => p.split(":"))
        );
        let correct = 0;
        opts.forEach((pair, i) => {
          if (studentMap[String(i)] === pair.right) correct++;
        });
        totalScore += Math.round((correct / opts.length) * q.score);
        break;
      }

      case "SETUJU_TIDAK": {
        if (!q.correctAnswer) break;
        const studentParts = studentAnswer.split(",");
        const correctParts = q.correctAnswer.split(",");
        let correct = 0;
        correctParts.forEach((ans, i) => {
          if (studentParts[i] === ans) correct++;
        });
        totalScore += Math.round((correct / correctParts.length) * q.score);
        break;
      }

      case "ESSAY":
        break;
    }
  }

  const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const attempt = await db.examAttempt.create({
    data: {
      examId: id,
      studentId: session.user.id,
      attemptNumber: completedAttempts + 1,
      answers: answers ?? {},
      score: percentScore,
      isCompleted: true,
      submittedAt: new Date(),
    },
  });

  await logAudit({ entity: "ExamAttempt", entityId: attempt.id, action: "CREATE", after: { examId: id, attemptNumber: attempt.attemptNumber, score: percentScore, passed: percentScore >= exam.passingScore } });

  let certificateIssued = false;
  if (percentScore >= exam.passingScore && exam.classId) {
    try {
      const result = await checkAndIssueClassCompletionCertificate(session.user.id, exam.classId);
      certificateIssued = result.issued;
    } catch {
      // Non-blocking: certificate trigger failure should not affect exam submission
    }
  }

  return NextResponse.json({
    score: percentScore,
    passed: percentScore >= exam.passingScore,
    passingScore: exam.passingScore,
    attempt,
    certificateIssued,
  });
}
