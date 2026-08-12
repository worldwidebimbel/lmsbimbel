import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, addBranchFilter } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") || scope.branchId;
  const buildingId = searchParams.get("buildingId");

  const where = addBranchFilter(
    {
      ...(buildingId ? { buildingId } : {}),
      isActive: searchParams.get("isActive") === "false" ? false : undefined,
    },
    branchId
  );

  const rooms = await db.room.findMany({
    where,
    include: {
      building: { select: { id: true, name: true } },
      _count: { select: { classes: true, schedules: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = await getBranchScope();
  const body = await req.json();
  const {
    name,
    roomNumber,
    buildingId,
    branchId,
    capacity,
    floor,
    facilities,
  } = body;

  if (!name || !buildingId) {
    return NextResponse.json(
      { error: "name dan buildingId wajib diisi" },
      { status: 400 }
    );
  }

  const building = await db.building.findUnique({
    where: { id: buildingId },
    select: { branchId: true },
  });
  if (!building) {
    return NextResponse.json({ error: "Gedung tidak ditemukan" }, { status: 404 });
  }

  const targetBranchId =
    session.user.role === "SUPER_ADMIN" ? building.branchId : scope.branchId;

  try {
    const room = await db.room.create({
      data: {
        name,
        roomNumber: roomNumber || null,
        buildingId,
        branchId: targetBranchId || building.branchId,
        capacity: capacity ?? 30,
        floor: floor || null,
        facilities: facilities || undefined,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat ruangan" }, { status: 400 });
  }
}
