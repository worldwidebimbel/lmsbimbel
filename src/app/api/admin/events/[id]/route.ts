import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

async function getScopedEvent(id: string, branchId: string | null, isSuperAdmin: boolean) {
  const event = await db.event.findUnique({
    where: { id },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { registrations: true } },
    },
  });

  if (!event) return null;
  if (!isSuperAdmin && branchId && event.branchId !== branchId) return null;
  return event;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const event = await getScopedEvent(id, branchId, isSuperAdmin);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const existing = await db.event.findUnique({ where: { id }, include: { packages: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && branchId && existing.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const effectiveBranchId = isSuperAdmin ? requestedBranchId : existing.branchId;
  if (!isSuperAdmin && branchId && effectiveBranchId !== branchId) {
    return NextResponse.json({ error: "Cabang tidak sesuai" }, { status: 403 });
  }

  // Replace packages if provided
  if (Array.isArray(packages)) {
    await db.eventPackage.deleteMany({ where: { eventId: id } });
  }

  const data: any = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description: description || null }),
    ...(type !== undefined && { type }),
    ...(status !== undefined && { status }),
    ...(startDate !== undefined && { startDate: new Date(startDate) }),
    ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    ...(registrationDeadline !== undefined && { registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null }),
    ...(location !== undefined && { location: location || null }),
    ...(image !== undefined && { image: image || null }),
    ...(maxParticipants !== undefined && { maxParticipants: maxParticipants ? Number(maxParticipants) : null }),
    ...(isPaid !== undefined && { isPaid }),
    ...(isSuperAdmin && requestedBranchId !== undefined && { branchId: requestedBranchId }),
    ...(Array.isArray(packages) && packages.length > 0 && {
      packages: {
        create: packages.map((p: any) => ({
          name: p.name,
          price: Number(p.price) || 0,
          description: p.description || null,
          isActive: typeof p.isActive === "boolean" ? p.isActive : true,
        })),
      },
    }),
  };

  const event = await db.event.update({
    where: { id },
    data,
    include: {
      branch: { select: { id: true, name: true, code: true } },
      packages: true,
      _count: { select: { registrations: true } },
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const existing = await db.event.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isSuperAdmin && branchId && existing.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
