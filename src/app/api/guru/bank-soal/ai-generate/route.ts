import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface GeneratedQuestion {
  type: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: number;
  score?: number;
}

const LETTER_INDEX: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

/**
 * The model answers with option LETTERS, but the grader compares against option
 * TEXT. Translate letters into their option text so generated questions can
 * actually be scored. Falls back to the raw value when it isn't a letter.
 */
function resolveCorrectAnswer(q: GeneratedQuestion): string | null {
  const raw = (q.correctAnswer ?? "").trim();
  if (!raw) return null;

  const opts = Array.isArray(q.options) ? q.options : null;
  if (!opts) return raw;

  const separator = raw.includes("|") ? "|" : raw.includes(",") ? "," : null;

  if (separator) {
    const texts = raw
      .split(separator)
      .map((part) => opts[LETTER_INDEX[part.trim().toUpperCase()]])
      .filter((t): t is string => typeof t === "string");
    return texts.length > 0 ? texts.join("|") : raw;
  }

  const idx = LETTER_INDEX[raw.toUpperCase()];
  return idx !== undefined && opts[idx] !== undefined ? opts[idx] : raw;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Question Generator belum dikonfigurasi. Admin perlu set OPENAI_API_KEY (atau AI_API_KEY) di environment variables." },
      { status: 503 }
    );
  }

  // Configurable AI provider — defaults to APIClaude gateway
  const aiBaseUrl = process.env.AI_BASE_URL || "https://apiclaude.net/v1";

  const body = await req.json();
  const {
    topic,
    subjectName,
    questionType,
    difficulty,
    count,
    subjectId,
    examId,
    aiModel: clientModel,
    jenjang,
    kurikulum,
    bahasa,
    optionCount,
    detailInstruction,
    sourceMaterial,
    strictMode,
  } = body as {
    topic: string;
    subjectName?: string;
    questionType: string;
    difficulty: number;
    count: number;
    subjectId?: string;
    examId?: string;
    aiModel?: string;
    jenjang?: string;
    kurikulum?: string;
    bahasa?: string;
    optionCount?: number;
    detailInstruction?: string;
    sourceMaterial?: string;
    strictMode?: boolean;
  };

  // Use client-selected model if provided, otherwise fall back to env
  const aiModel = clientModel || process.env.AI_MODEL || "langgananku/claude-sonnet-4-20250514";

  if (!topic || !questionType || !count) {
    return NextResponse.json({ error: "topic, questionType, count wajib diisi" }, { status: 400 });
  }

  const typeLabels: Record<string, string> = {
    PILGAN: "Pilihan Ganda (single answer, A-E)",
    PILGAN_KOMPLEK: "Pilihan Ganda Kompleks (multiple answers, pipe-separated)",
    BENAR_SALAH: "Benar / Salah",
    ESSAY: "Essay (open-ended)",
    ISIAN: "Isian Singkat (short answer)",
  };

  const diffLabels: Record<number, string> = { 1: "Mudah", 2: "Sedang", 3: "Sulit" };

  const typeDesc = typeLabels[questionType] ?? questionType;
  const diffLabel = diffLabels[difficulty] ?? "Sedang";

  const lang = bahasa?.trim() || "Bahasa Indonesia";
  const nOpts = Math.min(5, Math.max(3, Number(optionCount) || 4));
  const lastLetter = ["A", "B", "C", "D", "E"][nOpts - 1];

  const systemPrompt = `You are an expert exam question generator for Indonesian education (bimbel/tutoring).
Write every question, option and explanation in ${lang}.
Return ONLY a JSON array, no markdown, no explanation.`;

  let userPrompt = `Generate ${count} exam question(s) with these specifications:
- Topic: ${topic}
- Subject: ${subjectName || "General"}
- Education level: ${jenjang || "Umum"}
- Curriculum: ${kurikulum || "Kurikulum Merdeka"}
- Question type: ${typeDesc}
- Difficulty: ${diffLabel}
- Language: ${lang} (use it for ALL question text, options and explanations)
`;

  if (detailInstruction?.trim()) {
    userPrompt += `
DETAILED INSTRUCTIONS (MUST FOLLOW):
${detailInstruction.trim()}
`;
  }

  if (sourceMaterial?.trim()) {
    userPrompt += `
SOURCE MATERIAL:
"""
${sourceMaterial.trim()}
"""
${
  strictMode
    ? "STRICT: Base the questions ONLY on the source material above. Do NOT use outside knowledge or facts."
    : "Use the source material above as the primary reference."
}
`;
  }

  userPrompt += `
`;

  if (questionType === "PILGAN") {
    userPrompt += `For each question, provide:
- "type": "PILGAN"
- "content": the question text
- "options": array of EXACTLY ${nOpts} answer choices (text only, no letter prefixes)
- "correctAnswer": the LETTER of the correct answer (A to ${lastLetter})
- "explanation": brief explanation of why the answer is correct
- "difficulty": ${difficulty}
- "score": 1

Example format:
[{"type":"PILGAN","content":"Ibu kota Indonesia adalah...","options":["Jakarta","Surabaya","Bandung","Medan"],"correctAnswer":"A","explanation":"Jakarta adalah ibu kota Indonesia.","difficulty":1,"score":1}]`;
  } else if (questionType === "PILGAN_KOMPLEK") {
    userPrompt += `For each question, provide:
- "type": "PILGAN_KOMPLEK"
- "content": the question text
- "options": array of EXACTLY ${nOpts} answer choices
- "correctAnswer": pipe-separated letters of ALL correct answers within A to ${lastLetter} (e.g. "A|C")
- "explanation": brief explanation
- "difficulty": ${difficulty}
- "score": 2

Example:
[{"type":"PILGAN_KOMPLEK","content":"Manakah yang termasuk bilangan prima?","options":["2","3","4","5","7"],"correctAnswer":"A|B|D|E","explanation":"2,3,5,7 prima. 4 bukan.","difficulty":2,"score":2}]`;
  } else if (questionType === "BENAR_SALAH") {
    userPrompt += `For each question, provide:
- "type": "BENAR_SALAH"
- "content": the statement
- "correctAnswer": "Benar" or "Salah"
- "explanation": brief explanation
- "difficulty": ${difficulty}
- "score": 1

Example:
[{"type":"BENAR_SALAH","content":"Air mendidih pada suhu 100°C di tekanan 1 atm.","correctAnswer":"Benar","explanation":"Titik didih air = 100°C pada 1 atm.","difficulty":1,"score":1}]`;
  } else if (questionType === "ESSAY") {
    userPrompt += `For each question, provide:
- "type": "ESSAY"
- "content": the essay question
- "correctAnswer": a model answer / key points
- "explanation": grading rubric or key points
- "difficulty": ${difficulty}
- "score": 5

Example:
[{"type":"ESSAY","content":"Jelaskan proses fotosintesis!","correctAnswer":"Fotosintesis adalah proses tumbuhan mengubah CO2 dan H2O menjadi glukosa dengan bantuan cahaya matahari.","explanation":"Cek: definisi, reaksi, faktor yang mempengaruhi","difficulty":3,"score":5}]`;
  } else if (questionType === "ISIAN") {
    userPrompt += `For each question, provide:
- "type": "ISIAN"
- "content": the fill-in-the-blank question
- "correctAnswer": the expected short answer
- "explanation": brief explanation
- "difficulty": ${difficulty}
- "score": 2

Example:
[{"type":"ISIAN","content":"Rumus luas lingkaran adalah π × ___","correctAnswer":"r²","explanation":"Luas = π × r²","difficulty":2,"score":2}]`;
  } else {
    userPrompt += `Generate appropriate format for ${questionType} questions.`;
  }

  userPrompt += `\n\nReturn ONLY a valid JSON array of ${count} question objects. No markdown, no code fences, no explanation.`;

  try {
    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      return NextResponse.json(
        { error: "AI service error. Coba lagi nanti." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let questions: GeneratedQuestion[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI response format tidak valid. Coba lagi." },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "AI tidak menghasilkan soal. Coba dengan topik yang lebih spesifik." },
        { status: 500 }
      );
    }

    if (body.saveToBank) {
      const toInsert = questions.map((q) => ({
        examId: examId ?? null,
        subjectId: subjectId ?? null,
        type: q.type as never,
        content: q.content,
        options: (q.options ?? null) as never,
        correctAnswer: resolveCorrectAnswer(q),
        explanation: q.explanation ?? null,
        score: q.score ?? 1,
        difficulty: q.difficulty ?? 2,
        tags: (topic ? [topic] : null) as never,
      }));

      const created = await db.question.createMany({ data: toInsert });
      return NextResponse.json({ questions, saved: created.count });
    }

    return NextResponse.json({ questions, saved: 0 });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi AI service." },
      { status: 500 }
    );
  }
}
