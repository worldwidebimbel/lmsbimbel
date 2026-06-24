import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const programs = await db.siteProgram.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(programs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const program = await db.siteProgram.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      icon: body.icon ?? "GraduationCap",
      color: body.color ?? "bg-blue-100 text-blue-700",
      linkUrl: body.linkUrl ?? null,
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(program, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  const program = await db.siteProgram.update({ where: { id }, data });
  return NextResponse.json(program);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await db.siteProgram.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
