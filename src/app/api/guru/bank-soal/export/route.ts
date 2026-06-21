import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

function extractImageUrl(content: string): string {
  const match = content.match(/src="([^"]+)"/);
  return match?.[1] ?? "";
}

function stripHtml(content: string): string {
  return content.replace(/<[^>]+>/g, "").trim();
}

function getOptionText(opt: unknown): string {
  if (typeof opt === "string") return opt;
  if (opt && typeof opt === "object" && "text" in opt) return String((opt as { text: string }).text);
  return "";
}

function getOptionImage(opt: unknown): string {
  if (opt && typeof opt === "object" && "imageUrl" in opt) return String((opt as { imageUrl: string }).imageUrl);
  return "";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "xlsx";
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const where: Record<string, unknown> = { examId: null };
  if (subjectId) where.subjectId = subjectId;
  if (type) where.type = type;

  const questions = await db.question.findMany({
    where,
    include: { subject: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (format === "json") {
    return new NextResponse(JSON.stringify(questions, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="bank-soal.json"',
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("SOAL");

  ws.views = [{ state: "frozen", ySplit: 1 }];

  const headers = [
    "tipe", "soal", "soal_image_url",
    "opsi_a", "opsi_a_image_url", "opsi_b", "opsi_b_image_url",
    "opsi_c", "opsi_c_image_url", "opsi_d", "opsi_d_image_url",
    "opsi_e", "opsi_e_image_url",
    "kunci_jawaban", "pembahasan", "pembahasan_image_url",
    "bobot", "kesulitan", "tags", "mapel",
  ];

  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.style = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center" },
    };
  });
  ws.getRow(1).height = 22;

  for (const q of questions) {
    const opts = Array.isArray(q.options) ? q.options : [];
    const soalText = stripHtml(q.content);
    const soalImg = extractImageUrl(q.content);
    const expl = q.explanation ?? "";
    const explText = stripHtml(expl);
    const explImg = extractImageUrl(expl);

    const labels = ["A", "B", "C", "D", "E"];
    let kunci = q.correctAnswer ?? "";
    if (q.type === "PILGAN") {
      const optsText = opts.map(getOptionText);
      const idx = optsText.indexOf(kunci);
      if (idx >= 0) kunci = labels[idx];
    } else if (q.type === "PILGAN_KOMPLEK") {
      const keys = kunci.split("|");
      const optsText = opts.map(getOptionText);
      kunci = keys.map((k) => {
        const idx = optsText.indexOf(k);
        return idx >= 0 ? labels[idx] : k;
      }).join("|");
    }

    const tagsArr = Array.isArray(q.tags) ? (q.tags as string[]) : [];

    ws.addRow([
      q.type,
      soalText,
      soalImg,
      getOptionText(opts[0]), getOptionImage(opts[0]),
      getOptionText(opts[1]), getOptionImage(opts[1]),
      getOptionText(opts[2]), getOptionImage(opts[2]),
      getOptionText(opts[3]), getOptionImage(opts[3]),
      getOptionText(opts[4]), getOptionImage(opts[4]),
      kunci,
      explText,
      explImg,
      q.score,
      q.difficulty,
      tagsArr.join(","),
      q.subject?.name ?? "",
    ]);
  }

  const colWidths = [18, 50, 30, 18, 25, 18, 25, 18, 25, 18, 25, 18, 25, 20, 45, 30, 8, 10, 25, 20];
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const wsEx = wb.addWorksheet("CONTOH", { properties: { tabColor: { argb: "FF16A34A" } } });
  wsEx.views = [{ state: "frozen", ySplit: 1 }];
  const exHeaders = wsEx.addRow(headers);
  exHeaders.eachCell((cell) => {
    cell.style = {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } },
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      alignment: { horizontal: "center" },
    };
  });
  wsEx.getRow(1).height = 22;

  const EXAMPLES: unknown[][] = [
    ["PILGAN", "Ibu kota Indonesia adalah...", "", "Jakarta", "", "Surabaya", "", "Bandung", "", "Medan", "", "", "", "A", "Jakarta adalah ibu kota Indonesia.", "", 1, 1, "Geografi,Indonesia", ""],
    ["PILGAN", "Nilai dari $\\frac{12}{4}+3$ adalah...", "", "3", "", "6", "", "9", "", "12", "", "", "", "B", "12÷4=3, ditambah 3=6", "", 1, 2, "Matematika,Aritmatika", ""],
    ["PILGAN_KOMPLEK", "Manakah yang termasuk bilangan prima?", "", "2", "", "3", "", "4", "", "5", "", "7", "", "A|B|D|E", "2, 3, 5, 7 adalah bilangan prima. 4 bukan.", "", 2, 2, "Matematika,Bilangan", ""],
    ["BENAR_SALAH", "Air mendidih pada suhu 100°C di tekanan 1 atm.", "", "", "", "", "", "", "", "", "", "", "", "Benar", "Titik didih air = 100°C pada tekanan normal.", "", 1, 1, "Fisika,Suhu", ""],
    ["BENAR_SALAH", "Matahari berputar mengelilingi bumi.", "", "", "", "", "", "", "", "", "", "", "", "Salah", "Bumilah yang berputar mengelilingi matahari (heliosentris).", "", 1, 1, "IPA", ""],
    ["ESSAY", "Jelaskan proses fotosintesis secara singkat!", "", "", "", "", "", "", "", "", "", "", "", "", "Fotosintesis: CO₂ + H₂O → glukosa + O₂ menggunakan energi cahaya matahari.", "", 5, 3, "Biologi,Tumbuhan", ""],
    ["ISIAN", "Rumus luas lingkaran adalah π × ___", "", "", "", "", "", "", "", "", "", "", "", "r²", "Luas = π × r²", "", 2, 2, "Matematika,Geometri", ""],
    ["ISIAN", "Tokoh proklamator kemerdekaan Indonesia adalah ___ dan ___", "", "", "", "", "", "", "", "", "", "", "", "Soekarno dan Hatta", "Proklamasi 17 Agustus 1945 dibacakan oleh Soekarno dan Hatta.", "", 2, 1, "Sejarah,Kemerdekaan", ""],
  ];

  const noteStyle: Partial<ExcelJS.Style> = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } },
    font: { color: { argb: "FF374151" }, italic: true, size: 10 },
    alignment: { wrapText: true },
  };

  EXAMPLES.forEach((row) => {
    const r = wsEx.addRow(row);
    r.eachCell((cell) => { cell.style = noteStyle; });
  });

  colWidths.forEach((w, i) => { wsEx.getColumn(i + 1).width = w; });

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="bank-soal-export.xlsx"',
    },
  });
}
