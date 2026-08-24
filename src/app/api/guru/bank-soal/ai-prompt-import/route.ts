import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface PromptQuestion {
  type: string;
  weight?: number;
  question_text: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  opt_e?: string;
  answer_key?: string;
  discussion?: string;
  image_prompt?: string;
  image_url?: string;
}

const TYPE_MAP: Record<string, string> = {
  PG: "PILGAN",
  COMPLEX: "PILGAN_KOMPLEK",
  TF: "BENAR_SALAH",
  AGREE: "SETUJU_TIDAK",
  MATCHING: "MENJODOHKAN",
  ESSAY: "ESSAY",
};

const LETTER_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

/** Restore LaTeX backslashes encoded as "@@" by the prompt template. */
function decodeLatex(text: string): string {
  return (text ?? "").replace(/@@/g, "\\");
}

/** Collect non-empty options in order A..E. */
function collectOptions(q: PromptQuestion): string[] {
  return [q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.opt_e]
    .map((o) => decodeLatex(o ?? "").trim())
    .filter((o) => o !== "");
}

/** Strip the HTML hint appended by the prompt template. */
function stripHint(text: string): string {
  return (text ?? "").replace(/<br>\s*<small[^>]*>[\s\S]*?<\/small>/gi, "").trim();
}

/** Append an uploaded image to the question content so it renders with the question. */
function withImage(content: string, imageUrl?: string): string {
  const url = (imageUrl ?? "").trim();
  if (!url) return content;
  return `${content}\n\n<img src="${url}" alt="Soal" class="max-h-48 rounded-lg" />`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { questions, subjectId, examId, topic } = body as {
    questions: PromptQuestion[];
    subjectId?: string | null;
    examId?: string | null;
    topic?: string;
  };

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "questions wajib berupa array dan tidak boleh kosong" }, { status: 400 });
  }

  const rows: {
    examId: string | null;
    subjectId: string | null;
    type: string;
    content: string;
    options: unknown;
    correctAnswer: string | null;
    explanation: string | null;
    score: number;
    difficulty: number;
    tags: unknown;
  }[] = [];

  const errors: string[] = [];

  questions.forEach((q, idx) => {
    const dbType = TYPE_MAP[q.type?.toUpperCase()];
    if (!dbType) {
      errors.push(`Soal #${idx + 1}: tipe "${q.type}" tidak dikenali`);
      return;
    }

    const content = decodeLatex(q.question_text ?? "").trim();
    if (!content) {
      errors.push(`Soal #${idx + 1}: question_text kosong`);
      return;
    }

    const score = Number(q.weight) > 0 ? Number(q.weight) : 10;
    const explanation = decodeLatex(q.discussion ?? "").trim() || null;
    const key = (q.answer_key ?? "").trim();

    let options: unknown = null;
    let correctAnswer: string | null = null;

    if (dbType === "PILGAN") {
      const opts = collectOptions(q);
      if (opts.length < 2) {
        errors.push(`Soal #${idx + 1}: opsi PG kurang dari 2`);
        return;
      }
      options = opts;
      const i = LETTER_INDEX[key.toUpperCase()];
      correctAnswer = i !== undefined && opts[i] !== undefined ? opts[i] : null;
      if (!correctAnswer) errors.push(`Soal #${idx + 1}: answer_key "${key}" tidak valid`);
    } else if (dbType === "PILGAN_KOMPLEK") {
      const opts = collectOptions(q);
      if (opts.length < 2) {
        errors.push(`Soal #${idx + 1}: opsi PG Kompleks kurang dari 2`);
        return;
      }
      options = opts;
      const texts = key
        .split(",")
        .map((l) => LETTER_INDEX[l.trim().toUpperCase()])
        .filter((i) => i !== undefined && opts[i] !== undefined)
        .map((i) => opts[i]);
      correctAnswer = texts.length > 0 ? texts.join("|") : null;
      if (!correctAnswer) errors.push(`Soal #${idx + 1}: answer_key "${key}" tidak valid`);
    } else if (dbType === "BENAR_SALAH") {
      correctAnswer = key.toUpperCase() === "A" ? "Benar" : "Salah";
    } else if (dbType === "SETUJU_TIDAK") {
      // Single-statement agree/disagree — statement lives in question_text
      options = [stripHint(content)];
      correctAnswer = key.toUpperCase() === "A" ? "Setuju" : "Tidak Setuju";
    } else if (dbType === "MENJODOHKAN") {
      const pairs = collectOptions(q)
        .map((raw) => {
          const [left, right] = raw.split("||").map((s) => s.trim());
          return left && right ? { left, right } : null;
        })
        .filter((p): p is { left: string; right: string } => p !== null);
      if (pairs.length < 2) {
        errors.push(`Soal #${idx + 1}: pasangan menjodohkan kurang dari 2 (gunakan format "Kiri || Kanan")`);
        return;
      }
      options = pairs;
    } else if (dbType === "ESSAY") {
      correctAnswer = decodeLatex(key) || null;
    }

    rows.push({
      examId: examId ?? null,
      subjectId: subjectId ?? null,
      type: dbType,
      content: withImage(content, q.image_url),
      options,
      correctAnswer,
      explanation,
      score,
      difficulty: 2,
      tags: topic ? [topic] : null,
    });
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: `Tidak ada soal valid. ${errors.slice(0, 5).join("; ")}` },
      { status: 400 }
    );
  }

  const created = await db.question.createMany({
    data: rows as never,
  });

  return NextResponse.json({
    saved: created.count,
    skipped: questions.length - rows.length,
    warnings: errors,
  });
}
