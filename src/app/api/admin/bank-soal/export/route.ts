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
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK", "GURU"].includes(session.user.role)) {
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

  if (format === "doc") {
    const labels = ["A", "B", "C", "D", "E"];
    const rows = questions.map((q, idx) => {
      const opts = Array.isArray(q.options) ? q.options : [];
      const soalText = stripHtml(q.content);
      const soalImg = extractImageUrl(q.content);
      let kunci = q.correctAnswer ?? "";
      if (q.type === "PILGAN") {
        const optsText = opts.map(getOptionText);
        const ki = optsText.indexOf(kunci);
        if (ki >= 0) kunci = labels[ki];
      } else if (q.type === "PILGAN_KOMPLEK") {
        const keys = kunci.split("|");
        const optsText = opts.map(getOptionText);
        kunci = keys.map((k) => {
          const ki = optsText.indexOf(k);
          return ki >= 0 ? labels[ki] : k;
        }).join(", ");
      }
      const tagsArr = Array.isArray(q.tags) ? (q.tags as string[]) : [];
      const optHtml = opts.map((o, i) => {
        const text = getOptionText(o);
        const img = getOptionImage(o);
        const imgTag = img ? `<br/><img src="${img}" style="max-height:80px;"/>` : "";
        return `<div style="margin-left:20px;margin-bottom:4px;">${labels[i] ?? ""}. ${text}${imgTag}</div>`;
      }).join("");
      const soalImgTag = soalImg ? `<br/><img src="${soalImg}" style="max-height:150px;"/>` : "";
      const diffLabel = q.difficulty === 1 ? "Mudah" : q.difficulty === 2 ? "Sedang" : "Sulit";
      return `<div style="margin-bottom:16px;border-bottom:1px solid #ccc;padding-bottom:12px;">
        <p style="font-weight:bold;">${idx + 1}. ${soalText}${soalImgTag}</p>
        ${optHtml}
        <p style="color:green;margin-top:4px;">Kunci: ${kunci}</p>
        ${q.explanation ? `<p style="color:#666;font-size:0.9em;">Pembahasan: ${stripHtml(q.explanation)}</p>` : ""}
        <p style="font-size:0.8em;color:#999;">Tipe: ${q.type} | Skor: ${q.score} | Kesulitan: ${diffLabel} | Mapel: ${q.subject?.name ?? "-"} | Tags: ${tagsArr.join(", ")}</p>
      </div>`;
    }).join("");
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Bank Soal</title>
      <style>body{font-family:Arial,sans-serif;font-size:12pt;} img{max-height:150px;}</style>
      </head><body><h2>Bank Soal Export</h2>${rows}</body></html>`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": 'attachment; filename="bank-soal.doc"',
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
      q.type, soalText, soalImg,
      getOptionText(opts[0]), getOptionImage(opts[0]),
      getOptionText(opts[1]), getOptionImage(opts[1]),
      getOptionText(opts[2]), getOptionImage(opts[2]),
      getOptionText(opts[3]), getOptionImage(opts[3]),
      getOptionText(opts[4]), getOptionImage(opts[4]),
      kunci, explText, explImg,
      q.score, q.difficulty, tagsArr.join(","), q.subject?.name ?? "",
    ]);
  }

  const colWidths = [18, 50, 30, 18, 25, 18, 25, 18, 25, 18, 25, 18, 25, 20, 45, 30, 8, 10, 25, 20];
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="bank-soal-export.xlsx"',
    },
  });
}
