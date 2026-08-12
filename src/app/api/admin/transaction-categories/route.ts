import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const categories = await db.transactionCategory.findMany({
    where: {
      ...(type ? { type: type as never } : {}),
      isActive: true,
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, code, type, order } = body;

  if (!name || !code || !type) {
    return NextResponse.json(
      { error: "name, code, dan type wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const category = await db.transactionCategory.create({
      data: {
        name,
        code: code.toUpperCase(),
        type: type as never,
        order: order ?? 0,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kode sudah digunakan" }, { status: 409 });
  }
}
