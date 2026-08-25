import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payroll = await db.teacherPayroll.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, email: true, profile: { select: { phone: true } } } },
      branch: { select: { id: true, name: true } },
      period: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true } },
    },
  });

  if (!payroll) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "GURU" && payroll.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAdminRole(session.user.role) && session.user.role !== "GURU") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  page.drawText("SLIP HONOR TUTOR", {
    x: width / 2 - 80, y: height - 60, size: 18, font: boldFont, color: rgb(0.12, 0.23, 0.54),
  });

  let y = height - 110;
  const lineHeight = 22;
  const labelX = 60;
  const valueX = 200;

  const rows = [
    ["Nama Tutor", payroll.teacher.name],
    ["Email", payroll.teacher.email],
    ["Cabang", payroll.branch?.name ?? "-"],
    ["Periode", payroll.period?.name ?? `${payroll.periodStart.toLocaleDateString("id-ID")} - ${payroll.periodEnd.toLocaleDateString("id-ID")}`],
    ["Total Pertemuan", String(payroll.totalMeetings)],
    ["Total Jam", String(payroll.totalHours)],
    ["Rate per Pertemuan", `Rp ${payroll.ratePerMeeting.toLocaleString("id-ID")}`],
    ["Rate per Jam", `Rp ${payroll.ratePerHour.toLocaleString("id-ID")}`],
    ["Total Honor", `Rp ${payroll.totalAmount.toLocaleString("id-ID")}`],
    ["Status", payroll.status],
    ["Disetujui Oleh", payroll.approver?.name ?? "-"],
    ["Tanggal Disetujui", payroll.approvedAt ? payroll.approvedAt.toLocaleDateString("id-ID") : "-"],
    ["Tanggal Dibayar", payroll.paidAt ? payroll.paidAt.toLocaleDateString("id-ID") : "-"],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: labelX, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(value), { x: valueX, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    y -= lineHeight;
  }

  y -= 30;
  page.drawText("Catatan:", { x: labelX, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
  y -= lineHeight;
  if (payroll.note) {
    const noteLines = payroll.note.split("\n");
    for (const line of noteLines) {
      page.drawText(line, { x: labelX, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 16;
    }
  }

  y -= 40;
  page.drawText(`Dibuat: ${new Date().toLocaleDateString("id-ID")}`, {
    x: labelX, y, size: 9, font, color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="slip-honor-${payroll.teacher.name.replace(/\s/g, "-")}.pdf"`,
    },
  });
}
