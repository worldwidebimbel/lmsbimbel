import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";

const VALID_TYPES = ["PILGAN", "PILGAN_KOMPLEK", "BENAR_SALAH", "MENJODOHKAN", "MENGURUTKAN", "SETUJU_TIDAK", "ESSAY", "ISIAN"] as const;
type ImportType = (typeof VALID_TYPES)[number];

export interface ImportRow {
  tipe: string;
  soal: string;
  soal_image_url?: string;
  opsi_a?: string;
  opsi_a_image_url?: string;
  opsi_b?: string;
  opsi_b_image_url?: string;
  opsi_c?: string;
  opsi_c_image_url?: string;
  opsi_d?: string;
  opsi_d_image_url?: string;
  opsi_e?: string;
  opsi_e_image_url?: string;
  kunci_jawaban?: string;
  pembahasan?: string;
  pembahasan_image_url?: string;
  bobot?: number;
  kesulitan?: number;
  tags?: string;
  subjectId?: string;
}

function buildOptionPayload(text: string | undefined, imageUrl: string | undefined) {
  if (!text && !imageUrl) return null;
  if (imageUrl) return { text: text ?? "", imageUrl };
  return text ?? "";
}

function buildContent(text: string, imageUrl?: string) {
  if (!imageUrl) return text;
  return `${text}\n\n<img src="${imageUrl}" alt="Soal" class="max-h-48 rounded-lg mt-2" />`;
}

function buildExplanation(text?: string, imageUrl?: string) {
  if (!text && !imageUrl) return null;
  const base = text ?? "";
  if (!imageUrl) return base || null;
  return `${base}\n\n<img src="${imageUrl}" alt="Pembahasan" class="max-h-48 rounded-lg mt-2" />`;
}

export interface ImportResult {
  row: number;
  status: "ok" | "error" | "skip";
  message?: string;
  soal?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { rows: ImportRow[]; subjectId?: string };
  const { rows, subjectId } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows tidak boleh kosong" }, { status: 400 });
  }

  const results: ImportResult[] = [];
  const toInsert: Prisma.QuestionCreateManyInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const tipe = (row.tipe ?? "").trim().toUpperCase() as ImportType;
    if (!VALID_TYPES.includes(tipe)) {
      results.push({ row: rowNum, status: "error", message: `Tipe tidak valid: "${row.tipe}"`, soal: row.soal });
      continue;
    }

    const soal = (row.soal ?? "").trim();
    if (!soal) {
      results.push({ row: rowNum, status: "error", message: "Kolom soal wajib diisi", soal: "" });
      continue;
    }

    const kunci = (row.kunci_jawaban ?? "").trim();
    if (["PILGAN", "PILGAN_KOMPLEK", "BENAR_SALAH", "ISIAN"].includes(tipe) && !kunci) {
      results.push({ row: rowNum, status: "error", message: `kunci_jawaban wajib untuk tipe ${tipe}`, soal });
      continue;
    }

    const content = buildContent(soal, row.soal_image_url);

    let options: unknown = null;
    let correctAnswer: string | null = kunci || null;

    if (tipe === "PILGAN" || tipe === "PILGAN_KOMPLEK") {
      const rawOpts = [
        { text: row.opsi_a, img: row.opsi_a_image_url },
        { text: row.opsi_b, img: row.opsi_b_image_url },
        { text: row.opsi_c, img: row.opsi_c_image_url },
        { text: row.opsi_d, img: row.opsi_d_image_url },
        { text: row.opsi_e, img: row.opsi_e_image_url },
      ];
      const labels = ["A", "B", "C", "D", "E"];
      const validOpts = rawOpts
        .map((o, idx) => ({ ...o, label: labels[idx] }))
        .filter((o) => o.text || o.img);

      if (validOpts.length < 2) {
        results.push({ row: rowNum, status: "error", message: "PILGAN butuh minimal 2 opsi", soal });
        continue;
      }

      options = validOpts.map((o) => buildOptionPayload(o.text, o.img));

      if (tipe === "PILGAN") {
        const labelIdx = labels.indexOf(kunci.toUpperCase());
        if (labelIdx === -1 || labelIdx >= validOpts.length) {
          results.push({ row: rowNum, status: "error", message: `kunci_jawaban "${kunci}" tidak valid (harus A–E)`, soal });
          continue;
        }
        correctAnswer = validOpts[labelIdx].text ?? kunci;
      } else {
        const keys = kunci.split("|").map((k) => k.trim().toUpperCase());
        const answers = keys.map((k) => {
          const idx = labels.indexOf(k);
          return idx >= 0 && idx < validOpts.length ? (validOpts[idx].text ?? k) : k;
        });
        correctAnswer = answers.join("|");
      }
    } else if (tipe === "BENAR_SALAH") {
      options = ["Benar", "Salah"];
      const lower = kunci.toLowerCase();
      correctAnswer = lower === "benar" || lower === "b" ? "Benar" : "Salah";
    } else if (tipe === "MENJODOHKAN") {
      const rawOpts = [row.opsi_a, row.opsi_b, row.opsi_c, row.opsi_d, row.opsi_e];
      const pairs = rawOpts
        .filter(Boolean)
        .map((o) => { const [left, right] = (o as string).split("::").map((s) => s.trim()); return { left: left ?? "", right: right ?? "" }; })
        .filter((p) => p.left && p.right);
      if (pairs.length < 2) {
        results.push({ row: rowNum, status: "error", message: "MENJODOHKAN butuh minimal 2 pasangan (format: kiri::kanan)", soal });
        continue;
      }
      options = pairs;
      correctAnswer = null;
    } else if (tipe === "MENGURUTKAN") {
      const items = [row.opsi_a, row.opsi_b, row.opsi_c, row.opsi_d, row.opsi_e].filter(Boolean) as string[];
      if (items.length < 2) {
        results.push({ row: rowNum, status: "error", message: "MENGURUTKAN butuh minimal 2 item di opsi_a, opsi_b, dst.", soal });
        continue;
      }
      options = items;
      correctAnswer = items.join(",");
    } else if (tipe === "SETUJU_TIDAK") {
      const rawOpts = [row.opsi_a, row.opsi_b, row.opsi_c, row.opsi_d, row.opsi_e].filter(Boolean) as string[];
      const stmts = rawOpts.map((o) => {
        const sep = o.lastIndexOf("::");
        if (sep === -1) return { text: o.trim(), answer: "Setuju" };
        return { text: o.slice(0, sep).trim(), answer: o.slice(sep + 2).trim() };
      }).filter((s) => s.text);
      if (stmts.length < 1) {
        results.push({ row: rowNum, status: "error", message: "SETUJU_TIDAK butuh minimal 1 pernyataan (format: pernyataan::Setuju atau ::Tidak)", soal });
        continue;
      }
      options = stmts.map((s) => s.text);
      correctAnswer = stmts.map((s) => s.answer).join(",");
    }

    const tags = row.tags
      ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : null;

    toInsert.push({
      examId: null,
      subjectId: row.subjectId ?? subjectId ?? null,
      type: tipe,
      content,
      options: options as never,
      correctAnswer,
      explanation: buildExplanation(row.pembahasan, row.pembahasan_image_url),
      score: Number(row.bobot) || 1,
      difficulty: Number(row.kesulitan) || 2,
      tags: tags as never,
    });

    results.push({ row: rowNum, status: "ok", soal: soal.slice(0, 60) });
  }

  let inserted = 0;
  if (toInsert.length > 0) {
    const created = await db.question.createMany({ data: toInsert });
    inserted = created.count;
  }

  if (inserted > 0) {
    await logAudit({ entity: "Question", entityId: "bank-import", action: "CREATE", after: { source: "excel-import", inserted, totalRows: rows.length, errors: results.filter((r) => r.status === "error").length, subjectId: subjectId ?? null } });
  }

  return NextResponse.json({
    inserted,
    total: rows.length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
