/**
 * Generic PDF export helper using pdf-lib.
 * Generates simple tabular PDF reports.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PdfColumn {
  header: string;
  key: string;
  width?: number;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  data: Record<string, string | number | null | undefined>[];
  orientation?: "portrait" | "landscape";
}

const PAGE_MARGIN = 50;
const ROW_HEIGHT = 20;
const HEADER_HEIGHT = 25;
const TITLE_HEIGHT = 40;

export async function generatePdfBuffer(options: PdfExportOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(options.title);
  pdfDoc.setCreator("LMS Bimbel");
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isLandscape = options.orientation === "landscape";
  const pageWidth = isLandscape ? 842 : 595;
  const pageHeight = isLandscape ? 595 : 842;

  const colWidths = options.columns.map((c) => c.width ?? Math.floor((pageWidth - PAGE_MARGIN * 2) / options.columns.length));
  const tableWidth = colWidths.reduce((s, w) => s + w, 0);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - PAGE_MARGIN;

  function drawHeader() {
    page.drawText(options.title, {
      x: PAGE_MARGIN,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    if (options.subtitle) {
      page.drawText(options.subtitle, {
        x: PAGE_MARGIN,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 15;
    }

    y -= 5;
    page.drawText(`Generated: ${new Date().toLocaleString("id-ID")}`, {
      x: PAGE_MARGIN,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= TITLE_HEIGHT;

    // Table header
    let x = PAGE_MARGIN;
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: y - HEADER_HEIGHT + 5,
      width: tableWidth,
      height: HEADER_HEIGHT,
      color: rgb(0.31, 0.27, 0.9),
    });

    for (let i = 0; i < options.columns.length; i++) {
      page.drawText(options.columns[i].header, {
        x: x + 4,
        y: y - HEADER_HEIGHT + 12,
        size: 9,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      x += colWidths[i];
    }
    y -= HEADER_HEIGHT;
  }

  function newPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - PAGE_MARGIN;
  }

  drawHeader();

  for (const row of options.data) {
    if (y < PAGE_MARGIN + ROW_HEIGHT) {
      newPage();
      drawHeader();
    }

    let x = PAGE_MARGIN;
    for (let i = 0; i < options.columns.length; i++) {
      const val = String(row[options.columns[i].key] ?? "");
      const truncated = val.length > 40 ? val.slice(0, 37) + "..." : val;
      page.drawText(truncated, {
        x: x + 4,
        y: y - ROW_HEIGHT + 12,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      x += colWidths[i];
    }

    y -= ROW_HEIGHT;

    // Row separator
    page.drawLine({
      start: { x: PAGE_MARGIN, y: y + 2 },
      end: { x: PAGE_MARGIN + tableWidth, y: y + 2 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
  }

  return Buffer.from(await pdfDoc.save());
}

export function pdfResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}

// ============================
// CERTIFICATE PDF GENERATION
// ============================

export interface CertificatePdfOptions {
  title: string;
  recipientName: string;
  certificateNo: string;
  headerText?: string;
  bodyText?: string;
  footerText?: string;
  signatureText?: string;
  issuedAt: Date;
  qrDataUrl?: string;
  score?: number | null;
  rank?: number | null;
}

export async function generateCertificatePdf(options: CertificatePdfOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Sertifikat - ${options.recipientName}`);
  pdfDoc.setCreator("LMS Bimbel");
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 842;
  const pageHeight = 595;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const cx = pageWidth / 2;
  const borderColor = rgb(0.25, 0.27, 0.9);
  const accentColor = rgb(0.31, 0.27, 0.9);
  const textColor = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.5, 0.5, 0.5);

  // Decorative border
  page.drawRectangle({
    x: 20, y: 20, width: pageWidth - 40, height: pageHeight - 40,
    borderColor: borderColor, borderWidth: 3,
  });
  page.drawRectangle({
    x: 28, y: 28, width: pageWidth - 56, height: pageHeight - 56,
    borderColor: rgb(0.6, 0.6, 0.8), borderWidth: 1,
  });

  // Header
  const headerText = options.headerText ?? "SERTIFIKAT";
  page.drawText(headerText, {
    x: cx - boldFont.widthOfTextAtSize(headerText, 36) / 2,
    y: pageHeight - 90,
    size: 36,
    font: boldFont,
    color: accentColor,
  });

  // Certificate number
  const certNoText = `No: ${options.certificateNo}`;
  page.drawText(certNoText, {
    x: cx - font.widthOfTextAtSize(certNoText, 10) / 2,
    y: pageHeight - 115,
    size: 10,
    font,
    color: lightGray,
  });

  // Body text
  const bodyText = options.bodyText ?? "Diberikan kepada";
  page.drawText(bodyText, {
    x: cx - italicFont.widthOfTextAtSize(bodyText, 14) / 2,
    y: pageHeight - 165,
    size: 14,
    font: italicFont,
    color: textColor,
  });

  // Recipient name (underlined)
  const nameSize = 28;
  const nameY = pageHeight - 210;
  page.drawText(options.recipientName, {
    x: cx - boldFont.widthOfTextAtSize(options.recipientName, nameSize) / 2,
    y: nameY,
    size: nameSize,
    font: boldFont,
    color: accentColor,
  });

  // Underline
  const nameWidth = boldFont.widthOfTextAtSize(options.recipientName, nameSize);
  page.drawLine({
    start: { x: cx - nameWidth / 2 - 10, y: nameY - 8 },
    end: { x: cx + nameWidth / 2 + 10, y: nameY - 8 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Title/description
  const titleText = `Untuk menyelesaikan: ${options.title}`;
  page.drawText(titleText, {
    x: cx - font.widthOfTextAtSize(titleText, 12) / 2,
    y: pageHeight - 250,
    size: 12,
    font,
    color: textColor,
  });

  // Score/rank if present
  let infoY = pageHeight - 275;
  if (options.score != null) {
    const scoreText = `Nilai: ${options.score}`;
    page.drawText(scoreText, {
      x: cx - font.widthOfTextAtSize(scoreText, 12) / 2,
      y: infoY,
      size: 12,
      font: boldFont,
      color: textColor,
    });
    infoY -= 20;
  }
  if (options.rank != null) {
    const rankText = `Peringkat: ${options.rank}`;
    page.drawText(rankText, {
      x: cx - font.widthOfTextAtSize(rankText, 12) / 2,
      y: infoY,
      size: 12,
      font: boldFont,
      color: textColor,
    });
  }

  // Date
  const dateStr = options.issuedAt.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  const dateText = `Diterbitkan: ${dateStr}`;
  page.drawText(dateText, {
    x: cx - font.widthOfTextAtSize(dateText, 10) / 2,
    y: 80,
    size: 10,
    font,
    color: lightGray,
  });

  // Footer text
  if (options.footerText) {
    page.drawText(options.footerText, {
      x: cx - font.widthOfTextAtSize(options.footerText, 9) / 2,
      y: 60,
      size: 9,
      font,
      color: lightGray,
    });
  }

  // Signature (bottom-left)
  if (options.signatureText) {
    page.drawText(options.signatureText, {
      x: 80,
      y: 110,
      size: 11,
      font: boldFont,
      color: textColor,
    });
    page.drawLine({
      start: { x: 80, y: 100 },
      end: { x: 230, y: 100 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
    page.drawText("Penandatangan", {
      x: 80, y: 88, size: 9, font, color: lightGray,
    });
  }

  // QR Code (bottom-right)
  if (options.qrDataUrl) {
    try {
      const qrBase64 = options.qrDataUrl.split(",")[1];
      const qrBytes = Buffer.from(qrBase64, "base64");
      const qrImage = await pdfDoc.embedPng(qrBytes);
      page.drawImage(qrImage, {
        x: pageWidth - 130,
        y: 55,
        width: 75,
        height: 75,
      });
      page.drawText("Scan untuk verifikasi", {
        x: pageWidth - 135, y: 42, size: 7, font, color: lightGray,
      });
    } catch {
      // QR embedding failed, skip
    }
  }

  return Buffer.from(await pdfDoc.save());
}
