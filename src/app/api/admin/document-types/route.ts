import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const types = await db.documentType.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, isRequired, maxSizeMb, allowedTypes, order } = body;

  if (!name || !allowedTypes?.length) {
    return NextResponse.json(
      { error: "name dan allowedTypes wajib diisi" },
      { status: 400 }
    );
  }

  const docType = await db.documentType.create({
    data: {
      name,
      description: description || null,
      isRequired: isRequired ?? true,
      maxSizeMb: maxSizeMb ?? 2,
      allowedTypes,
      order: order ?? 0,
    },
  });

  return NextResponse.json(docType, { status: 201 });
}
