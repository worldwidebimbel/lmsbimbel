import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  if (!examId) return NextResponse.json({ error: "examId wajib" }, { status: 400 });

  const sections = await db.examSection.findMany({
    where: { examId },
    include: { questions: { select: { id: true, content: true, type: true } } },
    orderBy: { order: "asc" },
  });

  const groups = await db.questionGroup.findMany({
    where: { examId },
    include: { questions: { select: { id: true, content: true, type: true } } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ sections, groups });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { examId, kind, name, duration, order, type, title, passageText, audioUrl, maxPlayCount, timeLimit } = body;

  if (!examId || !kind) return NextResponse.json({ error: "examId, kind wajib" }, { status: 400 });

  const exam = await db.exam.findUnique({ where: { id: examId } });
  if (!exam) return NextResponse.json({ error: "Exam tidak ditemukan" }, { status: 404 });

  if (session.user.role === "GURU") {
    if (exam.classId) {
      const cls = await db.class.findUnique({ where: { id: exam.classId }, select: { teacherId: true } });
      if (cls?.teacherId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  if (kind === "SECTION") {
    if (!name || !duration) return NextResponse.json({ error: "name, duration wajib untuk section" }, { status: 400 });
    const section = await db.examSection.create({
      data: { examId, name, duration: Number(duration), order: order ?? 0 },
    });
    await logAudit({ entity: "ExamSection", entityId: section.id, action: "CREATE", after: { examId, name } });
    return NextResponse.json(section, { status: 201 });
  }

  if (kind === "GROUP") {
    if (!type) return NextResponse.json({ error: "type wajib untuk group (AUDIO/READING)" }, { status: 400 });
    const group = await db.questionGroup.create({
      data: {
        examId,
        type: type as never,
        title: title ?? null,
        passageText: passageText ?? null,
        audioUrl: audioUrl ?? null,
        maxPlayCount: maxPlayCount ?? null,
        timeLimit: timeLimit ?? null,
        order: order ?? 0,
      },
    });
    await logAudit({ entity: "QuestionGroup", entityId: group.id, action: "CREATE", after: { examId, type } });
    return NextResponse.json(group, { status: 201 });
  }

  return NextResponse.json({ error: "kind harus SECTION atau GROUP" }, { status: 400 });
}
