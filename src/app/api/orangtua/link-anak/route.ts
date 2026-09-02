import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope } from "@/lib/branch-context";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const children = await db.parentChild.findMany({
    where: {
      parentId: session.user.id,
      child: branchId ? { defaultBranchId: branchId } : {},
    },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return NextResponse.json(children.map((c) => c.child));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branchId } = await getBranchScope();
  const body = await req.json();
  const { childEmail } = body;
  if (!childEmail) return NextResponse.json({ error: "Email anak wajib diisi" }, { status: 400 });

  const child = await db.user.findUnique({ where: { email: childEmail } });
  if (!child || child.role !== "SISWA") return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
  if (branchId && child.defaultBranchId !== branchId) {
    return NextResponse.json({ error: "Siswa tidak berada di cabang yang sama" }, { status: 403 });
  }

  const exists = await db.parentChild.findUnique({
    where: { parentId_childId: { parentId: session.user.id, childId: child.id } },
  });
  if (exists) return NextResponse.json({ error: "Sudah terhubung" }, { status: 409 });

  const link = await db.parentChild.create({
    data: { parentId: session.user.id, childId: child.id },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  await logAudit({ entity: "ParentChild", entityId: `${session.user.id}-${child.id}`, action: "CREATE", after: { childEmail } });
  return NextResponse.json(link.child, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { childId } = body;
  if (!childId) return NextResponse.json({ error: "childId wajib" }, { status: 400 });

  await db.parentChild.delete({
    where: { parentId_childId: { parentId: session.user.id, childId } },
  });
  await logAudit({ entity: "ParentChild", entityId: `${session.user.id}-${childId}`, action: "DELETE" });
  return NextResponse.json({ success: true });
}
