import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/export-pdf";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const certificate = await db.certificate.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!certificate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (certificate.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      bodyText: template?.bodyText ?? "Diberikan kepada:",
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
