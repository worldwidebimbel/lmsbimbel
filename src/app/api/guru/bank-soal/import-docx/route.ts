import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import mammoth from "mammoth";
import type { ImportRow } from "../import/route";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });

  const ext = file.name.toLowerCase().split(".").pop();
  if (ext !== "docx") {
    return NextResponse.json({ error: "Hanya file .docx yang didukung" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    const rows = parseDocxQuestions(text);

    if (rows.length === 0) {
      return NextResponse.json({
        error: "Tidak ada soal yang terdeteksi. Pastikan format: setiap soal diawali dengan 'Soal:' atau nomor soal, lalu opsi A-E, dan 'Kunci:' / 'Jawaban:'.",
      }, { status: 400 });
    }

    return NextResponse.json({ rows, count: rows.length });
  } catch (err) {
    return NextResponse.json({
      error: `Gagal parse docx: ${err instanceof Error ? err.message : "unknown error"}`,
    }, { status: 500 });
  }
}

function parseDocxQuestions(text: string): ImportRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: ImportRow[] = [];
  let current: Partial<ImportRow> = {};
  let inOptions = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect new question
    const qMatch = line.match(/^(?:soal\s*[:\-]?\s*|pertanyaan\s*[:\-]?\s*|\d+\s*[.):]\s*)(.+)/i);
    if (qMatch && !lower.startsWith("opsi") && !lower.startsWith("pilihan") && !lower.match(/^[a-e]\s*[.):]/i)) {
      // Save previous question
      if (current.soal) {
        rows.push(current as ImportRow);
      }
      current = { tipe: "PILGAN", soal: qMatch[1].trim() };
      inOptions = false;
      continue;
    }

    // Detect options
    const optMatch = line.match(/^[a-eA-E]\s*[.):]\s*(.+)/);
    if (optMatch) {
      inOptions = true;
      const optText = optMatch[1].trim();
      const letter = line[0].toLowerCase();
      const key = `opsi_${letter}` as keyof ImportRow;
      (current as Record<string, unknown>)[key] = optText;
      continue;
    }

    // Detect answer key
    const keyMatch = line.match(/(?:kunci|jawaban)\s*[:\-]?\s*(.+)/i);
    if (keyMatch) {
      current.kunci_jawaban = keyMatch[1].trim();
      continue;
    }

    // Detect explanation
    const explMatch = line.match(/(?:pembahasan|penjelasan)\s*[:\-]?\s*(.+)/i);
    if (explMatch) {
      current.pembahasan = explMatch[1].trim();
      continue;
    }

    // Detect type
    const typeMatch = line.match(/(?:tipe|type)\s*[:\-]?\s*(.+)/i);
    if (typeMatch) {
      current.tipe = typeMatch[1].trim().toUpperCase();
      continue;
    }

    // Detect difficulty
    const diffMatch = line.match(/(?:kesulitan|difficulty)\s*[:\-]?\s*(.+)/i);
    if (diffMatch) {
      const d = diffMatch[1].trim().toLowerCase();
      current.kesulitan = d === "mudah" ? 1 : d === "sulit" ? 3 : 2;
      continue;
    }

    // Continuation of current question text
    if (current.soal && !inOptions) {
      current.soal += " " + line;
    }
  }

  // Don't forget the last question
  if (current.soal) {
    rows.push(current as ImportRow);
  }

  return rows;
}
