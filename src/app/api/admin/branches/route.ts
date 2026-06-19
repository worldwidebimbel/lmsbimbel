import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const branches = await db.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { users: true, classes: true, invoices: true },
      },
    },
  });

  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, name, address, phone, email, managerName } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "code dan name wajib diisi" }, { status: 400 });
  }

  try {
    const branch = await db.branch.create({
      data: {
        code: code.toUpperCase(),
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        managerName: managerName || null,
      },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Kode cabang sudah digunakan" }, { status: 409 });
  }
}
