import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { calcLevel, calcPoints, computeBadges } from "@/lib/gamification";
import { getBranchScope } from "@/lib/branch-context";
import { generateCertificateNo, generateCertificateCode } from "@/lib/certificate";
import PrestasiClient from "@/components/siswa/PrestasiClient";

export const metadata = { title: "Prestasi & Gamifikasi" };

export default async function PrestasiPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const studentId = session.user.id;
  const { branchId } = await getBranchScope();

  const [materiSelesai, tugasData, ujianData, absenData, gradeData, myClasses] = await Promise.all([
    db.materialProgress.count({ where: { studentId, isCompleted: true } }),
    db.submission.findMany({
      where: { studentId },
      select: { score: true },
    }),
    db.examAttempt.findMany({
      where: { studentId, isCompleted: true },
      select: { score: true },
    }),
    db.attendanceRecord.count({ where: { studentId, status: "HADIR" } }),
    db.grade.findMany({
      where: { studentId },
      select: { score: true },
    }),
    db.classStudent.findMany({
      where: { studentId },
      select: { classId: true },
    }),
  ]);

  const tugasDikumpulkan = tugasData.length;
  const tugasNilaiLulus = tugasData.filter((t) => t.score !== null && t.score >= 75).length;
  const ujianSelesai = ujianData.length;
  const ujianNilaiLulus = ujianData.filter((u) => u.score !== null && u.score >= 75).length;
  const avgGrade = gradeData.length > 0 ? gradeData.reduce((s, g) => s + g.score, 0) / gradeData.length : 0;
  const maxGrade = gradeData.length > 0 ? Math.max(...gradeData.map((g) => g.score)) : 0;

  const { total: totalPoints, breakdown } = calcPoints({
    materiSelesai,
    tugasDikumpulkan,
    tugasNilaiLulus,
    ujianSelesai,
    ujianNilaiLulus,
    totalHadir: absenData,
  });

  const levelInfo = calcLevel(totalPoints);

  const existing = await db.studentPoints.findUnique({ where: { userId: studentId } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = 1;
  if (existing?.lastActivityDate) {
    const last = new Date(existing.lastActivityDate); last.setHours(0, 0, 0, 0);
    if (last.getTime() === today.getTime()) newStreak = existing.streak;
    else if (last.getTime() === yesterday.getTime()) newStreak = (existing.streak ?? 0) + 1;
    else newStreak = 1;
  }

  const badges = computeBadges({ materiSelesai, tugasDikumpulkan, ujianSelesai, totalHadir: absenData, avgGrade, maxGrade, totalPoints, streak: newStreak });

  await db.studentPoints.upsert({
    where: { userId: studentId },
    update: { points: totalPoints, level: levelInfo.level, xp: totalPoints, streak: newStreak, lastActivityDate: new Date() },
    create: { userId: studentId, points: totalPoints, level: levelInfo.level, xp: totalPoints, streak: newStreak, lastActivityDate: new Date() },
  });

  const earnedBadgeIds = badges.filter((b) => b.earned).map((b) => b.id);
  if (earnedBadgeIds.length > 0) {
    const existingDbBadges = await db.badge.findMany({ where: { criteria: { in: earnedBadgeIds } }, select: { id: true, criteria: true } });
    for (const dbBadge of existingDbBadges) {
      if (!dbBadge.criteria) continue;
      await db.studentBadge.upsert({
        where: { studentId_badgeId: { studentId, badgeId: dbBadge.id } },
        update: {},
        create: { studentId, badgeId: dbBadge.id },
      }).catch(() => {});
    }
  }

  if (levelInfo.level >= 3) {
    const hasCert = await db.certificate.findFirst({ where: { userId: studentId, type: "LMS_COMPLETION", title: { contains: "LMS" } } });
    if (!hasCert) {
      const studentUser = await db.user.findUnique({ where: { id: studentId }, select: { name: true } });
      await db.certificate.create({
        data: {
          code: await generateCertificateCode(),
          certificateNo: await generateCertificateNo(),
          userId: studentId,
          type: "LMS_COMPLETION",
          title: "Sertifikat Kelulusan LMS",
          recipientName: studentUser?.name ?? "",
        },
      });
    }
  }

  const myCertificates = await db.certificate.findMany({
    where: { userId: studentId },
    orderBy: { issuedAt: "desc" },
  });

  const classIds = myClasses.map((c) => c.classId);
  const classmateIds = classIds.length > 0
    ? (await db.classStudent.findMany({
        where: { classId: { in: classIds }, studentId: { not: studentId } },
        select: { studentId: true },
        distinct: ["studentId"],
      })).map((c) => c.studentId)
    : [];

  const leaderboard = await Promise.all(
    [studentId, ...classmateIds].map(async (sid) => {
      const [mat, tasks, exams, hadir, user] = await Promise.all([
        db.materialProgress.count({ where: { studentId: sid, isCompleted: true } }),
        db.submission.count({ where: { studentId: sid } }),
        db.examAttempt.count({ where: { studentId: sid, isCompleted: true } }),
        db.attendanceRecord.count({ where: { studentId: sid, status: "HADIR" } }),
        db.user.findUnique({ where: { id: sid }, select: { id: true, name: true, avatar: true } }),
      ]);
      const pts = mat * 10 + tasks * 20 + exams * 25 + hadir * 5;
      return { id: sid, name: user?.name ?? "?", avatar: user?.avatar ?? null, points: pts };
    })
  );

  leaderboard.sort((a, b) => b.points - a.points);
  const myRank = leaderboard.findIndex((l) => l.id === studentId) + 1;

  const branchLeaderboard = branchId
    ? await (async () => {
        const branchStudents = await db.user.findMany({
          where: { defaultBranchId: branchId, role: "SISWA", isActive: true },
          select: { id: true, name: true, avatar: true },
        });
        const points = await db.studentPoints.findMany({
          where: { userId: { in: branchStudents.map((u) => u.id) } },
          select: { userId: true, points: true },
        });
        const pointsMap = Object.fromEntries(points.map((p) => [p.userId, p.points]));
        return branchStudents
          .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar ?? null, points: pointsMap[u.id] ?? 0 }))
          .sort((a, b) => b.points - a.points);
      })()
    : [];
  const myBranchRank = branchLeaderboard.findIndex((l) => l.id === studentId) + 1;

  return (
    <PrestasiClient
      totalPoints={totalPoints}
      level={levelInfo.level}
      levelName={levelInfo.name}
      levelColor={levelInfo.color}
      levelBg={levelInfo.bg}
      nextLevelPoints={levelInfo.nextLevelPoints}
      progressToNextLevel={levelInfo.progressToNextLevel}
      breakdown={JSON.parse(JSON.stringify(breakdown))}
      badges={JSON.parse(JSON.stringify(badges))}
      leaderboard={JSON.parse(JSON.stringify(leaderboard.slice(0, 20)))}
      myRank={myRank}
      branchLeaderboard={JSON.parse(JSON.stringify(branchLeaderboard.slice(0, 20)))}
      myBranchRank={myBranchRank || 0}
      studentId={studentId}
      streak={newStreak}
      certificates={JSON.parse(JSON.stringify(myCertificates))}
    />
  );
}
