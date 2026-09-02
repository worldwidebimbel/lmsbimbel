import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIProviderId, DEFAULT_PROVIDER_ID, getProvider, resolveProviderConfig } from "@/lib/ai-providers";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

interface MatchingPair {
  left: string;
  right: string;
}

interface GeneratedQuestion {
  type: string;
  content: string;
  options?: string[] | MatchingPair[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: number;
  score?: number;
  imagePrompt?: string;
  imageUrl?: string;
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

  // Matching questions carry their answer inside the pairs, not a letter key.
  if (q.type === "MENJODOHKAN") return null;

  const opts = Array.isArray(q.options)
    ? (q.options.filter((o) => typeof o === "string") as string[])
    : null;
  if (!opts || opts.length === 0) return raw;

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

/** Append an uploaded image to the question content so it renders with the question. */
function withImage(content: string, imageUrl?: string): string {
  const url = (imageUrl ?? "").trim();
  if (!url) return content;
  return `${content}\n\n<img src="${url}" alt="Soal" class="max-h-48 rounded-lg" />`;
}

/**
 * Matching questions must be stored as `{ left, right }` pairs. Models sometimes
 * answer with `"Kiri || Kanan"` strings instead, so accept both shapes.
 */
function normalizeOptions(q: GeneratedQuestion): unknown {
  if (!Array.isArray(q.options)) return null;
  if (q.type !== "MENJODOHKAN") return q.options;

  const pairs = (q.options as unknown[])
    .map((raw) => {
      if (typeof raw === "string") {
        const [left, right] = raw.split("||").map((s) => s.trim());
        return left && right ? { left, right } : null;
      }
      if (raw && typeof raw === "object") {
        const o = raw as Record<string, unknown>;
        const left = typeof o.left === "string" ? o.left.trim() : "";
        const right = typeof o.right === "string" ? o.right.trim() : "";
        return left && right ? { left, right } : null;
      }
      return null;
    })
    .filter((p): p is { left: string; right: string } => p !== null);

  return pairs.length > 0 ? pairs : null;
}

function buildInsertRows(
  questions: GeneratedQuestion[],
  examId: string | null,
  subjectId: string | null,
  topic?: string
) {
  return questions.map((q) => ({
    examId: examId ?? null,
    subjectId: subjectId ?? null,
    type: q.type as never,
    content: withImage(q.content, q.imageUrl),
    options: normalizeOptions(q) as never,
    correctAnswer: resolveCorrectAnswer(q),
    explanation: q.explanation ?? null,
    score: q.score ?? 1,
    difficulty: q.difficulty ?? 2,
    tags: (topic ? [topic] : null) as never,
  }));
}

export async function POST(req: NextRequest) {
  const limited = RATE_LIMITS.ai(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Direct save path: the client sends back the previewed questions (possibly
  // with uploaded images) so nothing is regenerated and images are preserved.
  if (Array.isArray(body.questionsToSave) && body.questionsToSave.length > 0) {
    const rows = buildInsertRows(
      body.questionsToSave as GeneratedQuestion[],
      body.examId ?? null,
      body.subjectId ?? null,
      body.topic
    );
    const created = await db.question.createMany({ data: rows });
    await logAudit({ entity: "Question", entityId: "ai-save", action: "CREATE", after: { source: "ai-direct-save", inserted: created.count, examId: body.examId ?? null, subjectId: body.subjectId ?? null } });
    return NextResponse.json({ questions: body.questionsToSave, saved: created.count });
  }

  const {
    topic,
    subjectName,
    questionType,
    difficulty,
    count,
    subjectId,
    examId,
    aiProvider,
    aiModel: clientModel,
    jenjang,
    kurikulum,
    bahasa,
    optionCount,
    detailInstruction,
    sourceMaterial,
    strictMode,
    imageMode,
  } = body as {
    topic: string;
    subjectName?: string;
    questionType: string;
    difficulty: number;
    count: number;
    subjectId?: string;
    examId?: string;
    aiProvider?: AIProviderId;
    aiModel?: string;
    jenjang?: string;
    kurikulum?: string;
    bahasa?: string;
    optionCount?: number;
    detailInstruction?: string;
    sourceMaterial?: string;
    strictMode?: boolean;
    imageMode?: boolean;
  };

  const provider = getProvider(aiProvider ?? DEFAULT_PROVIDER_ID);
  const providerConfig = resolveProviderConfig(provider.id);

  if (!providerConfig.apiKey) {
    return NextResponse.json(
      {
        error: `AI Question Generator belum dikonfigurasi untuk provider ${provider.label}. Admin perlu set ${providerConfig.keyEnvName} di environment variables.`,
      },
      { status: 503 }
    );
  }

  const aiBaseUrl = providerConfig.baseUrl;
  // Use client-selected model if provided, otherwise fall back to the provider default
  const aiModel = clientModel || providerConfig.defaultModel;

  if (!topic || !questionType || !count) {
    return NextResponse.json({ error: "topic, questionType, count wajib diisi" }, { status: 400 });
  }

  const typeLabels: Record<string, string> = {
    PILGAN: "Pilihan Ganda (single answer, A-E)",
    PILGAN_KOMPLEK: "Pilihan Ganda Kompleks (multiple answers, pipe-separated)",
    BENAR_SALAH: "Benar / Salah",
    MENJODOHKAN: "Menjodohkan (matching pairs)",
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
  } else if (questionType === "MENJODOHKAN") {
    userPrompt += `For each question, provide:
- "type": "MENJODOHKAN"
- "content": the instruction text (e.g. "Jodohkan negara dengan ibu kotanya!")
- "options": array of EXACTLY ${nOpts} pair objects, each shaped {"left":"...","right":"..."}
- "correctAnswer": "" (leave empty — the pairing itself is the answer)
- "explanation": brief explanation of the pairings
- "difficulty": ${difficulty}
- "score": ${nOpts}

RULES:
- "left" holds the prompt item, "right" holds its matching item. Each left must match exactly one right.
- Keep both sides short (1-5 words) and unambiguous.

Example:
[{"type":"MENJODOHKAN","content":"Jodohkan negara dengan ibu kotanya!","options":[{"left":"Indonesia","right":"Jakarta"},{"left":"Jepang","right":"Tokyo"},{"left":"Mesir","right":"Kairo"}],"correctAnswer":"","explanation":"Ibu kota masing-masing negara.","difficulty":2,"score":3}]`;
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

  if (imageMode) {
    userPrompt += `

IMAGE MODE (MANDATORY):
- Every question MUST be designed so that an image/illustration is required to answer it.
- Add an extra key "imagePrompt" to each object: a detailed image description in ${lang}, ready to paste into an AI image generator (mention objects, activity, setting and illustration style).
- The "imagePrompt" MUST be synchronised with the question and its options.
- Start "content" with a reference sentence such as "Perhatikan gambar berikut!" followed by a newline and the actual question.
- Answer options must relate to what is shown in the image, including plausible distractors.
- Do NOT write placeholders like [Image of ...] inside "content" — the visual description belongs ONLY in "imagePrompt".`;
  }

  try {
    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerConfig.apiKey}`,
        ...providerConfig.headers,
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
      console.error(`AI API error (${provider.id}/${aiModel}):`, errText);
      return NextResponse.json(
        { error: `AI service error dari ${provider.label} (model: ${aiModel}). Coba model lain atau ulangi nanti.` },
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
      const toInsert = buildInsertRows(questions, examId ?? null, subjectId ?? null, topic);
      const created = await db.question.createMany({ data: toInsert });
      await logAudit({ entity: "Question", entityId: "ai-generate", action: "CREATE", after: { source: "ai-generate", provider: provider.id, model: aiModel, topic, questionType, inserted: created.count, examId: examId ?? null, subjectId: subjectId ?? null } });
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
