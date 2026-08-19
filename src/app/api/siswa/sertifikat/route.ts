import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const certificates = await db.certificate.findMany({
    where: { userId: session.user.id },
    include: { template: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json(certificates);
}
