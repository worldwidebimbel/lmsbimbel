import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await db.certificateTemplate.findMany({
    include: { _count: { select: { certificates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, type, backgroundImage, headerText, bodyText, footerText, signatureText, signatureImage, logoImage, fieldPositions, isActive } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Nama dan tipe template wajib diisi" }, { status: 400 });
  }

  const template = await db.certificateTemplate.create({
    data: {
      name,
      type,
      backgroundImage: backgroundImage ?? null,
      headerText: headerText ?? null,
      bodyText: bodyText ?? null,
      footerText: footerText ?? null,
      signatureText: signatureText ?? null,
      signatureImage: signatureImage ?? null,
      logoImage: logoImage ?? null,
      fieldPositions: fieldPositions ?? null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
