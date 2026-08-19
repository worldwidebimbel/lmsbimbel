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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["GURU", "SUPER_ADMIN", "ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Question Generator belum dikonfigurasi. Admin perlu set OPENAI_API_KEY di environment variables." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { topic, subjectName, questionType, difficulty, count, subjectId, examId } = body as {
    topic: string;
    subjectName?: string;
    questionType: string;
    difficulty: number;
    count: number;
    subjectId?: string;
    examId?: string;
  };

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

  const systemPrompt = `You are an expert exam question generator for Indonesian education (bimbel/tutoring).
Generate high-quality exam questions in Indonesian language.
Return ONLY a JSON array, no markdown, no explanation.`;

  let userPrompt = `Generate ${count} exam question(s) with these specifications:
- Topic: ${topic}
- Subject: ${subjectName ?? "General"}
- Question type: ${typeDesc}
- Difficulty: ${diffLabel}
- Language: Indonesian (Bahasa Indonesia)

`;

  if (questionType === "PILGAN") {
    userPrompt += `For each question, provide:
- "type": "PILGAN"
- "content": the question text
- "options": array of 4-5 answer choices (text only, no letter prefixes)
- "correctAnswer": the LETTER of the correct answer (A, B, C, D, or E)
- "explanation": brief explanation of why the answer is correct
- "difficulty": ${difficulty}
- "score": 1

Example format:
[{"type":"PILGAN","content":"Ibu kota Indonesia adalah...","options":["Jakarta","Surabaya","Bandung","Medan"],"correctAnswer":"A","explanation":"Jakarta adalah ibu kota Indonesia.","difficulty":1,"score":1}]`;
  } else if (questionType === "PILGAN_KOMPLEK") {
    userPrompt += `For each question, provide:
- "type": "PILGAN_KOMPLEK"
- "content": the question text
- "options": array of 4-5 answer choices
- "correctAnswer": pipe-separated letters of ALL correct answers (e.g. "A|C|D")
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
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
      console.error("OpenAI API error:", errText);
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
        correctAnswer: q.correctAnswer ?? null,
        explanation: q.explanation ?? null,
        score: q.score ?? 1,
        difficulty: q.difficulty ?? 2,
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
