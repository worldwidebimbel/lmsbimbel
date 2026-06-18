import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const children = await db.parentChild.findMany({
    where: { parentId: session.user.id },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return NextResponse.json(children.map((c) => c.child));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { childEmail } = body;
  if (!childEmail) return NextResponse.json({ error: "Email anak wajib diisi" }, { status: 400 });

  const child = await db.user.findUnique({ where: { email: childEmail } });
  if (!child || child.role !== "SISWA") return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });

  const exists = await db.parentChild.findUnique({
    where: { parentId_childId: { parentId: session.user.id, childId: child.id } },
  });
  if (exists) return NextResponse.json({ error: "Sudah terhubung" }, { status: 409 });

  const link = await db.parentChild.create({
    data: { parentId: session.user.id, childId: child.id },
    include: { child: { select: { id: true, name: true, email: true, avatar: true } } },
  });
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
  return NextResponse.json({ success: true });
}
