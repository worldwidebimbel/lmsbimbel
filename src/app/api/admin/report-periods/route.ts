import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const periods = await db.reportPeriod.findMany({
    include: {
      _count: { select: { raports: true, payrolls: true } },
      academicYear: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(periods);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, academicYearId, startDate, endDate, isActive } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "name, startDate, endDate wajib diisi" }, { status: 400 });
  }

  const period = await db.reportPeriod.create({
    data: {
      name,
      academicYearId: academicYearId ?? null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive ?? true,
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "ReportPeriod",
    entityId: period.id,
    after: { name },
  });

  return NextResponse.json(period, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, academicYearId, startDate, endDate, isActive } = body;

  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  const period = await db.reportPeriod.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(academicYearId !== undefined && { academicYearId: academicYearId ?? null }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  await logAudit({
    action: "UPDATE",
    entity: "ReportPeriod",
    entityId: id,
    after: { name },
  });

  return NextResponse.json(period);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

  await db.reportPeriod.delete({ where: { id } });

  await logAudit({
    action: "DELETE",
    entity: "ReportPeriod",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
