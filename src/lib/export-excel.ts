/**
 * Generic Excel export helper using exceljs.
 * Usage: call from API route, return as response.
 */

import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: string;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  summaryRows?: Record<string, unknown>[];
}

export async function generateExcelBuffer(options: ExcelExportOptions): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "LMS Bimbel";
  wb.created = new Date();

  const ws = wb.addWorksheet(options.sheetName || "Sheet1");

  ws.columns = options.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 20,
  }));

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const row of options.data) {
    const r = ws.addRow(row);
    for (const col of options.columns) {
      if (col.format && typeof row[col.key] === "number") {
        r.getCell(col.key).numFmt = col.format;
      }
    }
  }

  if (options.summaryRows && options.summaryRows.length > 0) {
    ws.addRow({});
    for (const row of options.summaryRows) {
      const r = ws.addRow(row);
      r.font = { bold: true };
    }
  }

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: ws.rowCount, column: options.columns.length },
  };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function excelResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
