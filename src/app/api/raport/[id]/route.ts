import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInAppNotification } from "@/lib/notification-helper";

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

  return NextResponse.json(raport);
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
  }

  const body = await req.json();
  const { finalGrade, predicate, description, teacherNote, principalNote, status } = body;

  const updated = await db.raport.update({
    where: { id },
    data: {
      ...(finalGrade !== undefined && { finalGrade }),
      ...(predicate !== undefined && { predicate }),
      ...(description !== undefined && { description: description ?? null }),
      ...(teacherNote !== undefined && { teacherNote: teacherNote ?? null }),
      ...(principalNote !== undefined && { principalNote: principalNote ?? null }),
      ...(status === "PUBLISHED" && { status, publishedAt: new Date() }),
      ...(status === "DRAFT" && { status, publishedAt: null }),
    },
    include: { student: { select: { id: true, name: true } } },
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

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.raport.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
