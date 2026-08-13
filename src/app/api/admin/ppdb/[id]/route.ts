import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, price: true } },
      branch: { select: { id: true, name: true, code: true } },
      educationLevel: { select: { id: true, name: true, code: true } },
      documents: {
        include: { documentType: true },
      },
      statusLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(registration);
}
