import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guardAI, logAIUsage } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import { getProvider, resolveProviderConfig, type AIProviderId } from "@/lib/ai-providers";
import { getBranchScope } from "@/lib/branch-context";

// ============================================================
// AI Builder — Fase 1: Materi Teks (AI Writer)
// Dua mode (mengikuti pola ai-generate):
// 1. Generate:  { topic, subjectName, ... } → draft JSON (belum tersimpan)
// 2. Save:      { saveDraft: {...}, jobId } → Material draft (isPublished: false)
// ============================================================

interface MaterialDraft {
  title: string;
  description: string | null;
  content: string;
  keyPoints: string[];
  tips: string | null;
  estDurationMenit: number | null;
}

const LENGTH_SPEC: Record<string, string> = {
  pendek: "sekitar 300 kata, 1-2 bagian",
  sedang: "sekitar 600 kata, 3-4 bagian",
  panjang: "sekitar 1000 kata, 5+ bagian",
};

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "TEXT");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();

  // ---------- Mode 2: simpan draft ----------
  if (body?.saveDraft) {
    const d = body.saveDraft as MaterialDraft & {
      classId?: string | null;
      subjectId?: string | null;
      chapterTitle?: string | null;
      chapterOrder?: number;
    };
    if (!d.title || !d.content) {
      return NextResponse.json({ error: "title dan content wajib diisi" }, { status: 400 });
    }

    const { isSuperAdmin, branchId } = await getBranchScope();
    if (d.classId && !isSuperAdmin) {
      const cls = await db.class.findUnique({ where: { id: d.classId }, select: { branchId: true } });
      if (!cls) return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
      if (branchId && cls.branchId !== branchId) {
        return NextResponse.json({ error: "Forbidden: kelas di luar cabang" }, { status: 403 });
      }
    }

    const material = await db.material.create({
      data: {
        title: d.title,
        description: d.description ?? null,
        classId: d.classId || null,
        subjectId: d.subjectId || null,
        uploaderId: session.userId,
        type: "TEXT",
        order: 0,
        isPublished: false, // draft — guru review dulu
        chapterTitle: d.chapterTitle || null,
        chapterOrder: d.chapterOrder ?? 0,
        content: d.content,
        keyPoints: Array.isArray(d.keyPoints) ? d.keyPoints.filter((k) => typeof k === "string" && k.trim()) : [],
        tips: d.tips ?? null,
      },
    });

    if (body.jobId) {
      await db.aiGenerationJob.update({
        where: { id: body.jobId },
        data: { resultMaterialId: material.id, status: "DONE" },
      }).catch(() => undefined);
    }

    await logAudit({ entity: "Material", entityId: material.id, action: "CREATE", after: { title: d.title, type: "TEXT", source: "ai-builder" } });
    return NextResponse.json({ material }, { status: 201 });
  }

  // ---------- Mode 1: generate draft ----------
  const {
    topic,
    subjectName,
    jenjang,
    kurikulum,
    bahasa,
    length,
    style,
    detailInstruction,
    sourceMaterial,
    aiProvider,
    aiModel: clientModel,
  } = body as {
    topic?: string;
    subjectName?: string;
    jenjang?: string;
    kurikulum?: string;
    bahasa?: string;
    length?: string;
    style?: string;
    detailInstruction?: string;
    sourceMaterial?: string;
    aiProvider?: AIProviderId;
    aiModel?: string;
  };

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Topik wajib diisi" }, { status: 400 });
  }

  const provider = getProvider(aiProvider ?? (settings.textProvider as AIProviderId));
  const providerConfig = resolveProviderConfig(provider.id);
  if (!providerConfig.apiKey) {
    return NextResponse.json(
      { error: `Provider ${provider.label} belum dikonfigurasi. Admin perlu set ${providerConfig.keyEnvName} di environment variables.` },
      { status: 503 }
    );
  }
  const model = clientModel || providerConfig.defaultModel;

  const lang = bahasa?.trim() || "Bahasa Indonesia";
  const lengthSpec = LENGTH_SPEC[length ?? "sedang"] ?? LENGTH_SPEC.sedang;
  const startedAt = Date.now();

  const systemPrompt = `You are an expert educational content writer for Indonesian education (bimbel/tutoring).
Write every text in ${lang}.
Return ONLY a valid JSON object, no markdown, no code fences.`;

  let userPrompt = `Write a complete learning material with these specifications:
- Topic: ${topic.trim()}
- Subject: ${subjectName?.trim() || "Umum"}
- Education level: ${jenjang?.trim() || "Umum"}
- Curriculum: ${kurikulum?.trim() || "Kurikulum Merdeka"}
- Length: ${lengthSpec}
- Writing style: ${style?.trim() || "mudah dipahami siswa, bertahap dari konsep ke contoh"}
- Language: ${lang} (ALL text in this language)
`;

  if (detailInstruction?.trim()) {
    userPrompt += `
DETAILED INSTRUCTIONS (MUST FOLLOW):
${detailInstruction.trim()}
`;
  }

  if (sourceMaterial?.trim()) {
    userPrompt += `
SOURCE MATERIAL (primary reference):
"""
${sourceMaterial.trim()}
"""
Base the material primarily on the source above. Do not contradict it.`;
  }

  userPrompt += `

Return a JSON object with EXACTLY these keys:
- "title": judul materi yang ringkas dan menarik
- "description": ringkasan 1-2 kalimat
- "content": materi lengkap dalam format markdown-lite PLAIN TEXT (bukan HTML): "# " untuk judul bagian utama, "## " untuk sub-judul, "**teks**" untuk penekanan, baris "1. ...", "2. ..." untuk daftar bernomor, dan tabel pipe "| Kolom | Kolom |". Do NOT use any HTML tags. Sertakan minimal satu contoh soal + pembahasan.
- "keyPoints": array berisi 3-6 poin kunci (string pendek)
- "tips": tips belajar singkat untuk siswa (1-2 kalimat)
- "estDurationMenit": estimasi durasi belajar dalam menit (angka bulat)`;

  try {
    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerConfig.apiKey}`,
        ...providerConfig.headers,
      },
      body: JSON.stringify({
        model,
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
      console.error(`AI text API error (${provider.id}/${model}):`, errText);
      return NextResponse.json(
        { error: `AI service error dari ${provider.label} (model: ${model}). Coba model lain atau ulangi nanti.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    let draft: MaterialDraft;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed?.title || !parsed?.content) throw new Error("missing keys");
      draft = {
        title: String(parsed.title),
        description: parsed.description ? String(parsed.description) : null,
        content: String(parsed.content),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        tips: parsed.tips ? String(parsed.tips) : null,
        estDurationMenit: parsed.estDurationMenit ? Number(parsed.estDurationMenit) : null,
      };
    } catch {
      return NextResponse.json({ error: "AI response format tidak valid. Coba lagi." }, { status: 502 });
    }

    const durationMs = Date.now() - startedAt;
    const costEstimate = settings.unitCosts.TEXT ?? 300;

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "TEXT",
        status: "DONE",
        provider: provider.id,
        model,
        params: { topic, subjectName, jenjang, kurikulum, length, style } as never,
        durationMs,
        costEstimate,
        createdBy: session.userId,
      },
    });
    await logAIUsage({ userId: session.userId, capability: "TEXT", provider: provider.id, model, units: 1, costEstimate });

    return NextResponse.json({ draft, jobId: job.id });
  } catch (e) {
    console.error("[AI text generate] error:", e);
    return NextResponse.json({ error: "Gagal generate materi. Coba lagi nanti." }, { status: 500 });
  }
}
