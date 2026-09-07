import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, assertBranchAccess } from "@/lib/branch-context";
import { sendInAppNotification } from "@/lib/notification-helper";
import { logAudit } from "@/lib/audit";
import {
  MAX_STARS,
  averageStars,
  ensureDefaultRubric,
  getRubricLevels,
  matchRubricByScore,
  matchRubricByStars,
} from "@/lib/raport-rubric";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const raport = await db.raport.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, subject: { select: { name: true } }, teacher: { select: { name: true } } } },
      academicYear: { select: { id: true, name: true } },
      attitudes: {
        include: { aspect: { select: { id: true, name: true, description: true, weight: true, order: true } } },
      },
    },
  });

  if (!raport) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "SISWA" && raport.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "ORANG_TUA" && raport.studentId !== session.user.id) {
    const child = await db.parentChild.findFirst({ where: { parentId: session.user.id, childId: raport.studentId } });
    if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "SISWA" || session.user.role === "ORANG_TUA") {
    if (raport.status !== "PUBLISHED") return NextResponse.json({ error: "Raport belum dipublikasi" }, { status: 403 });
  }

  if (session.user.role === "GURU") {
    const cls = await db.class.findUnique({ where: { id: raport.classId }, select: { teacherId: true } });
    if (cls?.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!["SISWA", "ORANG_TUA", "SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    const scope = await getBranchScope();
    if (!assertBranchAccess(raport.branchId, scope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [academicRubric, attitudeRubric] = await Promise.all([
    getRubricLevels("ACADEMIC"),
    getRubricLevels("ATTITUDE"),
  ]);

  return NextResponse.json({
    ...raport,
    attitudes: [...raport.attitudes].sort((a, b) => a.aspect.order - b.aspect.order),
    rubric: { academic: academicRubric, attitude: attitudeRubric },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const raport = await db.raport.findUnique({ where: { id } });
  if (!raport) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "GURU") {
    const cls = await db.class.findUnique({ where: { id: raport.classId }, select: { teacherId: true } });
    if (cls?.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    const scope = await getBranchScope();
    if (!assertBranchAccess(raport.branchId, scope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();
  const {
    finalGrade,
    predicate,
    description,
    teacherNote,
    principalNote,
    status,
    academicDescription,
    attitudeStars,
    attitudeDescription,
    attitudeNote,
    attitudes,
  } = body;

  await ensureDefaultRubric();

  const data: Record<string, unknown> = {
    ...(finalGrade !== undefined && { finalGrade }),
    ...(predicate !== undefined && { predicate }),
    ...(description !== undefined && { description: description ?? null }),
    ...(teacherNote !== undefined && { teacherNote: teacherNote ?? null }),
    ...(principalNote !== undefined && { principalNote: principalNote ?? null }),
    ...(academicDescription !== undefined && { academicDescription: academicDescription ?? null }),
    ...(attitudeDescription !== undefined && { attitudeDescription: attitudeDescription ?? null }),
    ...(attitudeNote !== undefined && { attitudeNote: attitudeNote ?? null }),
    ...(status === "PUBLISHED" && { status, publishedAt: new Date() }),
    ...(status === "DRAFT" && { status, publishedAt: null }),
  };

  if (finalGrade !== undefined && finalGrade !== null) {
    const academicLevels = await getRubricLevels("ACADEMIC");
    const level = matchRubricByScore(academicLevels, Number(finalGrade));
    data.academicStars = level?.stars ?? null;
    data.academicCategory = level?.category ?? null;
  }

  const attitudeLevels = await getRubricLevels("ATTITUDE");

  if (Array.isArray(attitudes)) {
    const aspectIds = attitudes.map((a: { aspectId?: string }) => a.aspectId).filter(Boolean) as string[];
    const validAspects = await db.attitudeAspect.findMany({
      where: { id: { in: aspectIds } },
      select: { id: true, weight: true },
    });
    const weightById = new Map(validAspects.map((a) => [a.id, a.weight]));

    for (const entry of attitudes as { aspectId?: string; stars?: unknown; note?: unknown }[]) {
      if (!entry.aspectId || !weightById.has(entry.aspectId)) continue;

      const starsNum = Number(entry.stars);
      const note = typeof entry.note === "string" && entry.note.trim() ? entry.note.trim() : null;

      if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > MAX_STARS) {
        await db.raportAttitude.deleteMany({ where: { raportId: id, aspectId: entry.aspectId } });
        continue;
      }

      const existingAttitude = await db.raportAttitude.findFirst({
        where: { raportId: id, aspectId: entry.aspectId },
        select: { id: true },
      });

      if (existingAttitude) {
        await db.raportAttitude.update({
          where: { id: existingAttitude.id },
          data: { stars: starsNum, note },
        });
      } else {
        await db.raportAttitude.create({
          data: { raportId: id, aspectId: entry.aspectId, stars: starsNum, note },
        });
      }
    }

    if (attitudeStars === undefined) {
      const saved = await db.raportAttitude.findMany({
        where: { raportId: id },
        include: { aspect: { select: { weight: true } } },
      });
      const avg = averageStars(saved.map((s) => ({ stars: s.stars, weight: s.aspect.weight })));
      if (avg !== null) {
        const rounded = Math.max(1, Math.min(MAX_STARS, Math.round(avg)));
        const level = matchRubricByStars(attitudeLevels, rounded);
        data.attitudeStars = rounded;
        data.attitudeCategory = level?.category ?? null;
        if (attitudeDescription === undefined && !raport.attitudeDescription) {
          data.attitudeDescription = level?.description ?? null;
        }
      } else {
        data.attitudeStars = null;
        data.attitudeCategory = null;
      }
    }
  }

  if (attitudeStars !== undefined) {
    if (attitudeStars === null) {
      data.attitudeStars = null;
      data.attitudeCategory = null;
    } else {
      const starsNum = Number(attitudeStars);
      if (!Number.isInteger(starsNum) || starsNum < 1 || starsNum > MAX_STARS) {
        return NextResponse.json({ error: `attitudeStars harus bilangan bulat 1-${MAX_STARS}` }, { status: 400 });
      }
      const level = matchRubricByStars(attitudeLevels, starsNum);
      data.attitudeStars = starsNum;
      data.attitudeCategory = level?.category ?? null;
      if (attitudeDescription === undefined && !raport.attitudeDescription) {
        data.attitudeDescription = level?.description ?? null;
      }
    }
  }

  const updated = await db.raport.update({
    where: { id },
    data,
    include: {
      student: { select: { id: true, name: true } },
      attitudes: { include: { aspect: { select: { id: true, name: true, order: true } } } },
    },
  });

  if (status === "PUBLISHED") {
    await sendInAppNotification(
      updated.studentId,
      "Rapor Telah Dipublikasi",
      `Rapor ${updated.student.name} untuk ${updated.semester} telah dipublikasi. Silakan lihat di menu Rapor.`,
      "/siswa/raport",
    );
    const parents = await db.parentChild.findMany({
      where: { childId: updated.studentId },
      select: { parentId: true },
    });
    for (const p of parents) {
      await sendInAppNotification(
        p.parentId,
        "Rapor Anak Telah Dipublikasi",
        `Rapor ${updated.student.name} telah dipublikasi. Silakan lihat di menu Rapor.`,
        "/orangtua/raport",
      );
    }
  }

  await logAudit({
    entity: "Raport",
    entityId: id,
    action: "UPDATE",
    before: { status: raport.status, attitudeStars: raport.attitudeStars },
    after: { status, finalGrade, attitudeStars: data.attitudeStars },
  });
  return NextResponse.json({
    ...updated,
    attitudes: [...updated.attitudes].sort((a, b) => a.aspect.order - b.aspect.order),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const raport = await db.raport.findUnique({ where: { id }, select: { id: true, branchId: true } });
  if (!raport) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scope = await getBranchScope();
  if (!assertBranchAccess(raport.branchId, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.raport.delete({ where: { id } });
  await logAudit({ entity: "Raport", entityId: id, action: "DELETE" });
  return NextResponse.json({ success: true });
}
