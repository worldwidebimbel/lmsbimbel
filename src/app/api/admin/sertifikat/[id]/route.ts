import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/permission";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCertificateNo, generateCertificateCode } from "@/lib/certificate";
import { generateCertificatePdf } from "@/lib/export-pdf";
import QRCode from "qrcode";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { userId, type, title, recipientName, eventId, eventName, score, rank, templateId } = body;

  if (!userId || !type || !title || !recipientName) {
    return NextResponse.json({ error: "userId, type, title, recipientName wajib diisi" }, { status: 400 });
  }

  const certificateNo = await generateCertificateNo();
  const code = await generateCertificateCode();

  const certificate = await db.certificate.create({
    data: {
      code,
      certificateNo,
      userId,
      type,
      title,
      recipientName,
      eventId: eventId ?? null,
      eventName: eventName ?? null,
      templateId: templateId ?? null,
      score: score ?? null,
      rank: rank ?? null,
    },
    include: { template: true, user: { select: { name: true, email: true } } },
  });

  await logAudit({ entity: "Certificate", entityId: certificate.id, action: "CREATE", after: { code, type, userId } });
  return NextResponse.json(certificate, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const certificate = await db.certificate.findUnique({
    where: { id },
    include: { template: true, user: { select: { name: true, email: true } } },
  });

  if (!certificate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { download } = Object.fromEntries(req.nextUrl.searchParams);

  if (download === "pdf") {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/sertifikat/${certificate.code}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1 });

    const template = certificate.template;
    const pdfBuffer = await generateCertificatePdf({
      title: certificate.title,
      recipientName: certificate.recipientName,
      certificateNo: certificate.certificateNo || certificate.code,
      headerText: template?.headerText ?? "SERTIFIKAT",
      bodyText: template?.bodyText ?? `Diberikan kepada:`,
      footerText: template?.footerText ?? "",
      signatureText: template?.signatureText ?? "",
      issuedAt: certificate.issuedAt,
      qrDataUrl,
      score: certificate.score,
      rank: certificate.rank,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sertifikat-${certificate.code}.pdf"`,
      },
    });
  }

  return NextResponse.json(certificate);
}
