import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

async function resolveEvent(id: string, branchId: string | null, isSuperAdmin: boolean) {
  const event = await db.event.findUnique({ where: { id } });
  if (!event) return null;
  if (!isSuperAdmin && branchId && event.branchId !== branchId) return null;
  return event;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exam = await db.exam.findFirst({
    where: { eventId: id },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(exam);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.exam.findFirst({ where: { eventId: id } });
  if (existing) return NextResponse.json({ error: "Event sudah memiliki ujian" }, { status: 409 });

  const body = await req.json();
  const { title, description, duration, startTime, endTime, isRandomized, passingScore } = body;

  if (!title || !duration) {
    return NextResponse.json({ error: "Judul dan durasi wajib diisi" }, { status: 400 });
  }

  const exam = await db.exam.create({
    data: {
      title,
      description: description ?? null,
      eventId: id,
      duration: Number(duration),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      isRandomized: Boolean(isRandomized),
      passingScore: Number(passingScore ?? 60),
      isPublished: false,
    },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return NextResponse.json(exam, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await resolveEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exam = await db.exam.findFirst({ where: { eventId: id } });
  if (!exam) return NextResponse.json({ error: "Ujian belum dibuat" }, { status: 404 });

  const body = await req.json();
  const { title, description, duration, startTime, endTime, isRandomized, passingScore, isPublished } = body;

  const updated = await db.exam.update({
    where: { id: exam.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description: description ?? null }),
      ...(duration !== undefined && { duration: Number(duration) }),
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
      ...(isRandomized !== undefined && { isRandomized: Boolean(isRandomized) }),
      ...(passingScore !== undefined && { passingScore: Number(passingScore) }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
    },
    include: {
      questions: { orderBy: { createdAt: "asc" } },
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(updated);
}
