import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guardAI, logAIUsage } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import { resolveImageProviderConfig } from "@/lib/ai-providers";
import { getBranchScope } from "@/lib/branch-context";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateImages, ASPECT_RATIOS, type AspectRatio } from "@/lib/ai-image-providers";

// ============================================================
// AI Builder — Fase 2: Materi Gambar (AI Image)
// Dua mode (mengikuti pola /api/ai/text):
// 1. Generate: { prompt, style, aspectRatio, count, provider, model }
//    → panggil provider image → upload Cloudinary ("ai-materials")
//    → MediaFile → AiGenerationJob (DONE) → usage log
//    → { images: [{ url, mediaId, publicId }], jobId }
// 2. Save:    { saveImage: { url, mediaId, title, classId, subjectId,
//                            chapterTitle }, jobId }
//    → Material (type IMAGE, isPublished: false) — guru review dulu
// ============================================================

// ---------- Style preset (gaya edukatif, future-commit.md §4.2) ----------
const STYLE_PRESETS: Record<string, string> = {
  flatvector: "flat vector illustration, clean minimal lines, solid colors, educational",
  diagram: "labeled educational diagram, clear annotations, clean technical style",
  kartun: "friendly cartoon illustration, colorful, suitable for students",
  whiteboard: "whiteboard hand-drawn sketch style, black ink on white background",
  realistic: "realistic detailed illustration, natural lighting",
  custom: "", // prompt apa adanya
};

// ============================================================
// Route handler
// ============================================================

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "IMAGE");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();

  // ---------- Mode 2: simpan sebagai Material IMAGE (draft) ----------
  if (body?.saveImage) {
    const d = body.saveImage as {
      url?: string;
      mediaId?: string;
      title?: string;
      classId?: string | null;
      subjectId?: string | null;
      chapterTitle?: string | null;
      chapterOrder?: number;
    };
    if (!d.url || !d.title?.trim()) {
      return NextResponse.json({ error: "url dan title wajib diisi" }, { status: 400 });
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
        title: d.title.trim(),
        description: null,
        classId: d.classId || null,
        subjectId: d.subjectId || null,
        uploaderId: session.userId,
        type: "IMAGE",
        fileUrl: d.url,
        order: 0,
        isPublished: false, // draft — guru review dulu (moderasi)
        chapterTitle: d.chapterTitle || null,
        chapterOrder: d.chapterOrder ?? 0,
      },
    });

    if (body.jobId) {
      await db.aiGenerationJob
        .update({ where: { id: body.jobId }, data: { resultMaterialId: material.id, status: "DONE" } })
        .catch(() => undefined);
    }

    await logAudit({
      entity: "Material",
      entityId: material.id,
      action: "CREATE",
      after: { title: d.title, type: "IMAGE", source: "ai-builder" },
    });
    return NextResponse.json({ material }, { status: 201 });
  }

  // ---------- Mode 1: generate gambar ----------
  const {
    prompt,
    style,
    aspectRatio,
    count,
    provider: clientProvider,
    model: clientModel,
  } = body as {
    prompt?: string;
    style?: string;
    aspectRatio?: string;
    count?: number;
    provider?: string;
    model?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
  }

  const providerId = clientProvider || settings.imageProvider;
  const cfg = resolveImageProviderConfig(providerId);
  if (!cfg.apiKey) {
    return NextResponse.json(
      { error: `Provider gambar belum dikonfigurasi. Admin perlu set ${cfg.keyEnvName} di environment variables.` },
      { status: 503 }
    );
  }

  const model = clientModel || cfg.defaultModel;
  const aspect = (ASPECT_RATIOS.includes(aspectRatio as AspectRatio) ? aspectRatio : "1:1") as AspectRatio;
  const numImages = Math.min(4, Math.max(1, Number(count) || 1));
  const styleKey = style && STYLE_PRESETS[style] !== undefined ? style : "custom";
  const styleHint = STYLE_PRESETS[styleKey] ?? "";
  const fullPrompt = styleHint ? `${prompt.trim()}. Style: ${styleHint}.` : prompt.trim();

  const startedAt = Date.now();
  const costPerImage = settings.unitCosts.IMAGE ?? 1500;
  const costEstimate = costPerImage * numImages;

  try {
    const genCfg = { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey!, model };
    const images = await generateImages(providerId, genCfg, fullPrompt, aspect, numImages);

    if (images.length === 0) {
      return NextResponse.json({ error: "Provider tidak mengembalikan gambar. Coba lagi." }, { status: 502 });
    }

    // Upload setiap gambar ke Cloudinary + buat MediaFile
    const uploaded: { url: string; mediaId: string; publicId: string }[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const filename = `ai_${Date.now()}_${i}`;
      const { url, publicId } = await uploadToCloudinary(img.buffer, "ai-materials", filename, "image");
      const media = await db.mediaFile.create({
        data: {
          name: `AI ${prompt.trim().slice(0, 40)}${prompt.length > 40 ? "…" : ""}`,
          url,
          publicId,
          resourceType: "image",
          mimeType: img.mimeType,
          size: img.buffer.length,
          folder: "ai-materials",
          uploadedById: session.userId,
        },
      });
      uploaded.push({ url, mediaId: media.id, publicId });
    }

    const durationMs = Date.now() - startedAt;

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "IMAGE",
        status: "DONE",
        provider: providerId,
        model,
        params: { prompt: prompt.trim(), style: styleKey, aspectRatio: aspect, count: numImages } as never,
        resultUrl: uploaded[0]?.url ?? null,
        resultMediaId: uploaded[0]?.mediaId ?? null,
        durationMs,
        costEstimate,
        createdBy: session.userId,
      },
    });
    await logAIUsage({
      userId: session.userId,
      capability: "IMAGE",
      provider: providerId,
      model,
      units: uploaded.length,
      costEstimate,
    });

    return NextResponse.json({ images: uploaded, jobId: job.id });
  } catch (e) {
    console.error("[AI image generate] error:", e);
    const message = e instanceof Error ? e.message : "Gagal generate gambar.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
