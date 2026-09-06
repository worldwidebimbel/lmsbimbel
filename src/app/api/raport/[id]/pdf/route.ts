import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, assertBranchAccess } from "@/lib/branch-context";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const raport = await db.raport.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true, teacherId: true, subject: { select: { name: true } }, teacher: { select: { name: true } } } },
      academicYear: { select: { id: true, name: true } },
    },
  });

  if (!raport) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "SISWA" && raport.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "ORANG_TUA" && raport.studentId !== session.user.id) {
    const child = await db.parentChild.findFirst({ where: { parentId: session.user.id, childId: raport.studentId } });
    if (!child) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if ((session.user.role === "SISWA" || session.user.role === "ORANG_TUA") && raport.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Raport belum dipublikasi" }, { status: 403 });
  }

  if (session.user.role === "GURU" && raport.class.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role !== "SISWA" && session.user.role !== "ORANG_TUA" && session.user.role !== "GURU") {
    const scope = await getBranchScope();
    if (!assertBranchAccess(raport.branchId, scope)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Raport - ${raport.student.name}`);
  pdfDoc.setCreator("LMS Bimbel");
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595;
  const pageHeight = 842;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  const cx = pageWidth / 2;
  const margin = 50;
  const textColor = rgb(0.15, 0.15, 0.15);
  const lightGray = rgb(0.5, 0.5, 0.5);
  const accentColor = rgb(0.2, 0.3, 0.6);

  let y = pageHeight - margin;

  // Header border
  page.drawRectangle({
    x: margin, y: y - 60, width: pageWidth - margin * 2, height: 50,
    borderColor: accentColor, borderWidth: 2,
  });

  // Title
  const title = "RAPORT SISWA";
  page.drawText(title, {
    x: cx - boldFont.widthOfTextAtSize(title, 22) / 2,
    y: y - 35,
    size: 22,
    font: boldFont,
    color: accentColor,
  });
  y -= 80;

  // Student info
  const infoLines = [
    { label: "Nama Siswa", value: raport.student.name },
    { label: "Kelas", value: raport.class.name },
    { label: "Mata Pelajaran", value: raport.class.subject.name },
    { label: "Tutor", value: raport.class.teacher?.name ?? "-" },
    { label: "Semester", value: raport.semester },
    { label: "Tahun Ajaran", value: raport.academicYear?.name ?? "-" },
    { label: "Periode", value: raport.period ?? "-" },
  ];

  for (const info of infoLines) {
    page.drawText(info.label + ":", {
      x: margin, y, size: 10, font: boldFont, color: textColor,
    });
    page.drawText(info.value, {
      x: margin + 120, y, size: 10, font, color: textColor,
    });
    y -= 20;
  }

  y -= 10;

  // Grade breakdown table
  page.drawText("Rincian Nilai", {
    x: margin, y, size: 12, font: boldFont, color: accentColor,
  });
  y -= 20;

  const breakdown = (raport.gradeBreakdown as { component: string; weight: number; score: number | null }[]) ?? [];
  const tableX = margin;
  const tableW = pageWidth - margin * 2;
  const colW = [tableW * 0.5, tableW * 0.2, tableW * 0.3];

  // Table header
  page.drawRectangle({
    x: tableX, y: y - 18, width: tableW, height: 18,
    color: accentColor,
  });
  const headers = ["Komponen", "Bobot", "Nilai"];
  let hx = tableX;
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: hx + 5, y: y - 13, size: 9, font: boldFont, color: rgb(1, 1, 1),
    });
    hx += colW[i];
  }
  y -= 18;

  for (const item of breakdown) {
    if (y < margin + 100) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const vals = [item.component, `${item.weight}`, item.score !== null ? String(item.score) : "-"];
    let vx = tableX;
    for (let i = 0; i < vals.length; i++) {
      page.drawText(vals[i], {
        x: vx + 5, y: y - 12, size: 9, font, color: textColor,
      });
      vx += colW[i];
    }
    y -= 18;
    page.drawLine({
      start: { x: tableX, y: y + 2 },
      end: { x: tableX + tableW, y: y + 2 },
      thickness: 0.3, color: rgb(0.8, 0.8, 0.8),
    });
  }

  y -= 10;

  // Final grade
  if (raport.finalGrade !== null) {
    page.drawText("Nilai Akhir:", {
      x: tableX, y, size: 11, font: boldFont, color: textColor,
    });
    const gradeText = raport.finalGrade.toFixed(1);
    page.drawText(gradeText, {
      x: tableX + tableW - boldFont.widthOfTextAtSize(gradeText, 14) - 5,
      y, size: 14, font: boldFont, color: accentColor,
    });
    y -= 20;

    if (raport.predicate) {
      page.drawText("Predikat:", {
        x: tableX, y, size: 11, font: boldFont, color: textColor,
      });
      page.drawText(raport.predicate, {
        x: tableX + 80, y, size: 12, font: boldFont, color: accentColor,
      });
      y -= 20;
    }
  }

  y -= 10;

  // Attendance summary
  const att = (raport.attendanceSummary as Record<string, number>) ?? {};
  page.drawText("Rekap Kehadiran", {
    x: margin, y, size: 12, font: boldFont, color: accentColor,
  });
  y -= 18;

  const attLabels: Record<string, string> = { HADIR: "Hadir", SAKIT: "Sakit", IZIN: "Izin", ALPHA: "Alpha" };
  for (const [key, label] of Object.entries(attLabels)) {
    page.drawText(`${label}: ${att[key] ?? 0}`, {
      x: margin, y, size: 10, font, color: textColor,
    });
    y -= 16;
  }

  y -= 15;

  // Notes
  if (raport.teacherNote) {
    page.drawText("Catatan Tutor:", {
      x: margin, y, size: 10, font: boldFont, color: textColor,
    });
    y -= 15;
    const noteLines = raport.teacherNote.split("\n");
    for (const line of noteLines) {
      page.drawText(line, {
        x: margin, y, size: 9, font: italicFont, color: textColor,
      });
      y -= 14;
    }
    y -= 5;
  }

  if (raport.principalNote) {
    page.drawText("Catatan Kepala:", {
      x: margin, y, size: 10, font: boldFont, color: textColor,
    });
    y -= 15;
    const noteLines = raport.principalNote.split("\n");
    for (const line of noteLines) {
      page.drawText(line, {
        x: margin, y, size: 9, font: italicFont, color: textColor,
      });
      y -= 14;
    }
    y -= 5;
  }

  // Signatures
  y -= 30;
  if (y < margin + 80) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  const sigY = y;
  page.drawText("Tutor", {
    x: margin + 40, y: sigY, size: 10, font, color: textColor,
  });
  page.drawText(raport.class.teacher?.name ?? "-", {
    x: margin + 40, y: sigY - 50, size: 10, font: boldFont, color: textColor,
  });
  page.drawLine({
    start: { x: margin + 30, y: sigY - 45 },
    end: { x: margin + 180, y: sigY - 45 },
    thickness: 0.5, color: rgb(0.6, 0.6, 0.6),
  });

  page.drawText("Kepala Bimbel", {
    x: pageWidth - margin - 160, y: sigY, size: 10, font, color: textColor,
  });
  page.drawLine({
    start: { x: pageWidth - margin - 170, y: sigY - 45 },
    end: { x: pageWidth - margin - 20, y: sigY - 45 },
    thickness: 0.5, color: rgb(0.6, 0.6, 0.6),
  });

  // Footer
  const dateStr = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  page.drawText(`Dicetak: ${dateStr}`, {
    x: cx - font.widthOfTextAtSize(`Dicetak: ${dateStr}`, 8) / 2,
    y: 30, size: 8, font, color: lightGray,
  });

  if (raport.status === "PUBLISHED" && raport.publishedAt) {
    const pubText = `Dipublikasi: ${new Date(raport.publishedAt).toLocaleDateString("id-ID")}`;
    page.drawText(pubText, {
      x: cx - font.widthOfTextAtSize(pubText, 8) / 2,
      y: 18, size: 8, font, color: lightGray,
    });
  }

  const buf = Buffer.from(await pdfDoc.save());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="raport-${raport.student.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
