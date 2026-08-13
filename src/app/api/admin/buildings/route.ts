import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope, addBranchFilter } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") || scope.branchId;

  const where = addBranchFilter(
    { isActive: searchParams.get("isActive") === "false" ? false : undefined },
    branchId
  );

  const buildings = await db.building.findMany({
    where,
    include: {
      _count: { select: { rooms: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(buildings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = await getBranchScope();
  const body = await req.json();
  const { name, branchId } = body;

  if (!name) {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }

  const targetBranchId = session.user.role === "SUPER_ADMIN" ? branchId : scope.branchId;
  if (!targetBranchId) {
    return NextResponse.json({ error: "Cabang harus dipilih" }, { status: 400 });
  }

  try {
    const building = await db.building.create({
      data: { name, branchId: targetBranchId },
    });
    return NextResponse.json(building, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat gedung" }, { status: 400 });
  }
}
