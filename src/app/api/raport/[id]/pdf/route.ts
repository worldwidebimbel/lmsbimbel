import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBranchScope, assertBranchAccess } from "@/lib/branch-context";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z";

const STAR_FILLED = rgb(0.96, 0.72, 0.16);
const STAR_EMPTY = rgb(0.85, 0.85, 0.85);

function drawStars(page: PDFPage, x: number, y: number, filled: number, size = 11, max = 5) {
  for (let i = 0; i < max; i++) {
    page.drawSvgPath(STAR_PATH, {
      x: x + i * (size + 1.5),
      y: y + size,
      scale: size / 24,
      color: i < filled ? STAR_FILLED : STAR_EMPTY,
    });
  }
}

function starsWidth(size = 11, max = 5) {
  return max * size + (max - 1) * 1.5;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
}

function sanitize(text: string) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/[^\x20-\xFF\n]/g, "");
}

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
      attitudes: { include: { aspect: { select: { id: true, name: true, order: true } } } },
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
  const contentWidth = pageWidth - margin * 2;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const drawParagraph = (text: string, size = 9, indent = 0) => {
    const lines = wrapText(sanitize(text), font, size, contentWidth - indent);
    for (const line of lines) {
      ensureSpace(size + 4);
      page.drawText(line, { x: margin + indent, y, size, font, color: textColor });
      y -= size + 4;
    }
  };

  const rubricLevels = await db.rubricLevel.findMany({
    select: { type: true, stars: true, category: true, description: true },
  });
  const levelFor = (type: "ACADEMIC" | "ATTITUDE", stars: number | null) =>
    stars === null ? null : rubricLevels.find((l) => l.type === type && l.stars === stars) ?? null;

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

  // Rubrik penilaian (bintang)
  if (raport.academicStars !== null || raport.attitudeStars !== null || raport.attitudes.length > 0) {
    ensureSpace(40);
    page.drawText("Rubrik Penilaian", { x: margin, y, size: 12, font: boldFont, color: accentColor });
    y -= 20;
  }

  if (raport.academicStars !== null) {
    ensureSpace(30);
    page.drawText("Capaian Akademik", { x: margin, y, size: 10, font: boldFont, color: textColor });
    y -= 16;

    ensureSpace(18);
    drawStars(page, margin, y - 2, raport.academicStars);
    const academicCat = raport.academicCategory ?? levelFor("ACADEMIC", raport.academicStars)?.category ?? "";
    if (academicCat) {
      page.drawText(sanitize(academicCat), {
        x: margin + starsWidth() + 8,
        y,
        size: 10,
        font: boldFont,
        color: accentColor,
      });
    }
    y -= 18;

    const academicDesc = raport.academicDescription ?? levelFor("ACADEMIC", raport.academicStars)?.description;
    if (academicDesc) drawParagraph(academicDesc);
    y -= 8;
  }

  if (raport.attitudeStars !== null || raport.attitudes.length > 0) {
    ensureSpace(30);
    page.drawText("Sikap dalam Belajar", { x: margin, y, size: 10, font: boldFont, color: textColor });
    y -= 16;

    if (raport.attitudeStars !== null) {
      ensureSpace(18);
      drawStars(page, margin, y - 2, raport.attitudeStars);
      const attitudeCat = raport.attitudeCategory ?? levelFor("ATTITUDE", raport.attitudeStars)?.category ?? "";
      if (attitudeCat) {
        page.drawText(sanitize(attitudeCat), {
          x: margin + starsWidth() + 8,
          y,
          size: 10,
          font: boldFont,
          color: accentColor,
        });
      }
      y -= 18;

      const attitudeDesc = raport.attitudeDescription ?? levelFor("ATTITUDE", raport.attitudeStars)?.description;
      if (attitudeDesc) drawParagraph(attitudeDesc);
      y -= 6;
    }

    const sortedAttitudes = [...raport.attitudes].sort((a, b) => a.aspect.order - b.aspect.order);
    for (const entry of sortedAttitudes) {
      ensureSpace(18);
      page.drawText(sanitize(entry.aspect.name), { x: margin + 10, y, size: 9, font, color: textColor });
      drawStars(page, margin + 160, y - 2, entry.stars, 9);
      const entryCat = levelFor("ATTITUDE", entry.stars)?.category;
      if (entryCat) {
        page.drawText(sanitize(entryCat), {
          x: margin + 160 + starsWidth(9) + 8,
          y,
          size: 8,
          font,
          color: lightGray,
        });
      }
      y -= 14;
      if (entry.note) drawParagraph(entry.note, 8, 20);
    }

    if (raport.attitudeNote) {
      y -= 4;
      ensureSpace(18);
      page.drawText("Catatan Sikap:", { x: margin, y, size: 9, font: boldFont, color: textColor });
      y -= 13;
      drawParagraph(raport.attitudeNote, 9, 10);
    }

    y -= 10;
  }

  // Attendance summary
  ensureSpace(90);
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
    ensureSpace(30);
    page.drawText("Catatan Tutor:", {
      x: margin, y, size: 10, font: boldFont, color: textColor,
    });
    y -= 15;
    for (const line of wrapText(sanitize(raport.teacherNote), italicFont, 9, contentWidth)) {
      ensureSpace(14);
      page.drawText(line, { x: margin, y, size: 9, font: italicFont, color: textColor });
      y -= 14;
    }
    y -= 5;
  }

  if (raport.principalNote) {
    ensureSpace(30);
    page.drawText("Catatan Kepala:", {
      x: margin, y, size: 10, font: boldFont, color: textColor,
    });
    y -= 15;
    for (const line of wrapText(sanitize(raport.principalNote), italicFont, 9, contentWidth)) {
      ensureSpace(14);
      page.drawText(line, { x: margin, y, size: 9, font: italicFont, color: textColor });
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
