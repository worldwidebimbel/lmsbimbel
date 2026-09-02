import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
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
  if (!session?.user || !isAdminRole(session.user.role)) {
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
    await logAudit({
      entity: "Branch",
      entityId: branch.id,
      action: "CREATE",
      after: { code: branch.code, name: branch.name },
    });
    return NextResponse.json(branch, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Kode cabang sudah digunakan" }, { status: 409 });
  }
}
