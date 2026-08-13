import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");

  if (parentId) {
    const children = await db.parentChild.findMany({
      where: {
        parentId,
        child: branchId && !isSuperAdmin ? { defaultBranchId: branchId } : {},
      },
      include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
    });
    return NextResponse.json(children);
  }

  const parents = await db.user.findMany({
    where: {
      role: "ORANG_TUA",
      isActive: true,
      ...(branchId && !isSuperAdmin ? { defaultBranchId: branchId } : {}),
    },
    select: { id: true, name: true, email: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const parentsWithChildren = await Promise.all(
    parents.map(async (p) => {
      const children = await db.parentChild.count({
        where: {
          parentId: p.id,
          child: branchId && !isSuperAdmin ? { defaultBranchId: branchId } : {},
        },
      });
      return { ...p, childrenCount: children };
    })
  );

  return NextResponse.json(parentsWithChildren);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branchId, isSuperAdmin } = await getBranchScope();
  const body = await req.json();
  const { parentId, childId } = body;
  if (!parentId || !childId) return NextResponse.json({ error: "parentId dan childId wajib" }, { status: 400 });

  const parent = await db.user.findUnique({ where: { id: parentId } });
  const child = await db.user.findUnique({ where: { id: childId } });
  if (!parent || parent.role !== "ORANG_TUA") return NextResponse.json({ error: "Parent bukan ORANG_TUA" }, { status: 400 });
  if (!child || child.role !== "SISWA") return NextResponse.json({ error: "Child bukan SISWA" }, { status: 400 });

  if (!isSuperAdmin && branchId && (parent.defaultBranchId !== branchId || child.defaultBranchId !== branchId)) {
    return NextResponse.json({ error: "Parent dan child harus di cabang yang sama" }, { status: 403 });
  }

  const exists = await db.parentChild.findUnique({
    where: { parentId_childId: { parentId, childId } },
  });
  if (exists) return NextResponse.json({ error: "Sudah terhubung" }, { status: 409 });

  const link = await db.parentChild.create({
    data: { parentId, childId },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { parentId, childId } = body;
  if (!parentId || !childId) return NextResponse.json({ error: "parentId dan childId wajib" }, { status: 400 });

  await db.parentChild.delete({
    where: { parentId_childId: { parentId, childId } },
  });
  return NextResponse.json({ success: true });
}
