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
