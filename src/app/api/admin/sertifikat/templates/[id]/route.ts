import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const template = await db.certificateTemplate.findUnique({
    where: { id },
    include: { _count: { select: { certificates: true } } },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const template = await db.certificateTemplate.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.backgroundImage !== undefined && { backgroundImage: body.backgroundImage ?? null }),
      ...(body.headerText !== undefined && { headerText: body.headerText ?? null }),
      ...(body.bodyText !== undefined && { bodyText: body.bodyText ?? null }),
      ...(body.footerText !== undefined && { footerText: body.footerText ?? null }),
      ...(body.signatureText !== undefined && { signatureText: body.signatureText ?? null }),
      ...(body.signatureImage !== undefined && { signatureImage: body.signatureImage ?? null }),
      ...(body.logoImage !== undefined && { logoImage: body.logoImage ?? null }),
      ...(body.fieldPositions !== undefined && { fieldPositions: body.fieldPositions ?? null }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const certCount = await db.certificate.count({ where: { templateId: id } });
  if (certCount > 0) {
    return NextResponse.json({ error: "Template masih digunakan oleh sertifikat" }, { status: 409 });
  }

  await db.certificateTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
