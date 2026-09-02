import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
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
  if (!session?.user || !isAdminRole(session.user.role)) {
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
    await logAudit({
      entity: "TransactionCategory",
      entityId: category.id,
      action: "CREATE",
      after: { name, code: code.toUpperCase(), type },
    });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kode sudah digunakan" }, { status: 409 });
  }
}
