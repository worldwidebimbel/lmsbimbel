import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const years = await db.academicYear.findMany({
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(years);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, startDate, endDate, isActive } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json(
      { error: "name, startDate, dan endDate wajib diisi" },
      { status: 400 }
    );
  }

  try {
    if (isActive) {
      await db.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const year = await db.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? false,
      },
    });
    return NextResponse.json(year, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Nama tahun ajaran sudah digunakan" }, { status: 409 });
  }
}
