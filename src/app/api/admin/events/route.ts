import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole, hasPermission } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

async function canManageEvents(role: string | undefined): Promise<boolean> {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  return hasPermission(role, "event.manage");
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();

  const events = await db.event.findMany({
    where: isSuperAdmin ? {} : branchId ? { branchId } : {},
    include: {
      branch: { select: { id: true, name: true, code: true } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !(await canManageEvents(session.user.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const {
    title,
    description,
    type,
    status,
    startDate,
    endDate,
    registrationDeadline,
    location,
    image,
    maxParticipants,
    isPaid,
    branchId: requestedBranchId,
    packages,
  } = body;

  if (!title || !startDate) {
    return NextResponse.json({ error: "Judul dan tanggal mulai wajib diisi" }, { status: 400 });
  }

  const effectiveBranchId = isSuperAdmin ? requestedBranchId : branchId;
  if (!effectiveBranchId) {
    return NextResponse.json({ error: "Cabang wajib dipilih" }, { status: 400 });
  }
  if (!isSuperAdmin && branchId && effectiveBranchId !== branchId) {
    return NextResponse.json({ error: "Cabang tidak sesuai" }, { status: 403 });
  }

  const data: any = {
    title,
    description: description || null,
    type: type || "TRYOUT",
    status: status || "DRAFT",
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
    location: location || null,
    image: image || null,
    maxParticipants: maxParticipants ? Number(maxParticipants) : null,
    isPaid: typeof isPaid === "boolean" ? isPaid : false,
    branchId: effectiveBranchId,
    createdBy: session.user.id,
    packages: Array.isArray(packages) && packages.length > 0 ? {
      create: packages.map((p: any) => ({
        name: p.name,
        price: Number(p.price) || 0,
        description: p.description || null,
        isActive: typeof p.isActive === "boolean" ? p.isActive : true,
      })),
    } : undefined,
  };

  const event = await db.event.create({
    data,
    include: {
      branch: { select: { id: true, name: true, code: true } },
      packages: true,
      _count: { select: { registrations: true } },
    },
  });

  await logAudit({
    entity: "Event",
    entityId: event.id,
    action: "CREATE",
    after: { title, branchId: effectiveBranchId, type: type || "TRYOUT" },
  });

  return NextResponse.json(event, { status: 201 });
}
