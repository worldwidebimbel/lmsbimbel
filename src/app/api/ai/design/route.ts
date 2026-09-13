import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { guardAI, logAIUsage } from "@/lib/ai-guard";
import { getAISettings } from "@/lib/ai-settings";
import { resolveImageProviderConfig } from "@/lib/ai-providers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { generateImages, type AspectRatio } from "@/lib/ai-image-providers";
import { getDesignPreset, type DesignPresetId } from "@/lib/ai-design-presets";

// ============================================================
// AI Builder — Fase 2b: Aset Visual CMS (kapabilitas DESIGN)
// Dua mode (mengikuti pola /api/ai/image):
// 1. Generate: { prompt, presetId, provider, model }
//    → preset menentukan rasio & style hint → generate → upload Cloudinary
//      ("ai-cms") → MediaFile → AiGenerationJob (DONE) → usage log
//    → { images: [{ url, mediaId, publicId }], jobId }
// 2. Install ("Pasang ke..."): { install: { url, mediaId, presetId, target... }, jobId }
//    → buat/update entitas CMS tujuan (SiteBanner, SiteProgram.imageUrl,
//      SiteConfig.popupBgImage, BlogPost.coverImage, SiteGallery)
// Catatan: capability DESIGN di-guard oleh ai-guard (role matrix + flag
// FEAT_AI_DESIGN). Hanya role dengan akses DESIGN (default SUPER_ADMIN &
// ADMIN) yang bisa memanggil route ini.
// ============================================================

export async function POST(req: NextRequest) {
  const guard = await guardAI(req, "DESIGN");
  if (guard instanceof NextResponse) return guard;
  const { session } = guard;

  const settings = await getAISettings();
  const body = await req.json();

  // ---------- Mode 2: "Pasang ke..." (install ke entitas CMS) ----------
  if (body?.install) {
    const d = body.install as {
      url?: string;
      mediaId?: string;
      presetId?: string;
      // Target-specific fields:
      title?: string; // SiteBanner / SiteGallery
      subtitle?: string; // SiteBanner
      linkUrl?: string; // SiteBanner
      linkLabel?: string; // SiteBanner
      programId?: string; // SiteProgram
      blogId?: string; // BlogPost
      category?: string; // SiteGallery
      description?: string; // SiteGallery
    };
    if (!d.url || !d.presetId) {
      return NextResponse.json({ error: "url dan presetId wajib diisi" }, { status: 400 });
    }
    const preset = getDesignPreset(d.presetId);
    if (!preset) {
      return NextResponse.json({ error: "Preset tidak dikenal" }, { status: 400 });
    }

    try {
      switch (preset.installTarget) {
        case "SiteBanner": {
          const banner = await db.siteBanner.create({
            data: {
              title: d.title?.trim() || "Banner AI",
              subtitle: d.subtitle ?? null,
              imageUrl: d.url,
              linkUrl: d.linkUrl ?? null,
              linkLabel: d.linkLabel ?? null,
              isActive: true,
              order: 0,
            },
          });
          await logAudit({ entity: "SiteBanner", entityId: banner.id, action: "CREATE", after: { title: banner.title, source: "ai-design" } });
          return NextResponse.json({ installed: "SiteBanner", id: banner.id, banner }, { status: 201 });
        }

        case "SiteProgram": {
          if (!d.programId) {
            return NextResponse.json({ error: "programId wajib untuk preset Cover Program" }, { status: 400 });
          }
          const program = await db.siteProgram.update({
            where: { id: d.programId },
            data: { imageUrl: d.url },
          });
          await logAudit({ entity: "SiteProgram", entityId: program.id, action: "UPDATE", after: { imageUrl: d.url, source: "ai-design" } });
          return NextResponse.json({ installed: "SiteProgram", id: program.id, program });
        }

        case "SitePopup": {
          // popupBgImage disimpan di SiteConfig (key-value)
          await db.siteConfig.upsert({
            where: { key: "popupBgImage" },
            create: { key: "popupBgImage", value: d.url },
            update: { value: d.url },
          });
          await logAudit({ entity: "SiteConfig", entityId: "popupBgImage", action: "UPDATE", after: { popupBgImage: d.url, source: "ai-design" } });
          return NextResponse.json({ installed: "SitePopup", url: d.url });
        }

        case "BlogPost": {
          if (!d.blogId) {
            return NextResponse.json({ error: "blogId wajib untuk preset Cover Blog" }, { status: 400 });
          }
          const post = await db.blogPost.update({
            where: { id: d.blogId },
            data: { coverImage: d.url },
          });
          await logAudit({ entity: "BlogPost", entityId: post.id, action: "UPDATE", after: { coverImage: d.url, source: "ai-design" } });
          return NextResponse.json({ installed: "BlogPost", id: post.id, post });
        }

        case "SiteGallery": {
          const item = await db.siteGallery.create({
            data: {
              title: d.title?.trim() || "Galeri AI",
              description: d.description ?? null,
              imageUrl: d.url,
              category: d.category ?? "AKTIVITAS",
              isActive: true,
              order: 0,
            },
          });
          await logAudit({ entity: "SiteGallery", entityId: item.id, action: "CREATE", after: { title: item.title, source: "ai-design" } });
          return NextResponse.json({ installed: "SiteGallery", id: item.id, item }, { status: 201 });
        }

        case "MediaOnly": {
          // Sudah tersimpan di MediaFile saat generate — tidak ada entitas tambahan.
          return NextResponse.json({ installed: "MediaOnly", url: d.url });
        }
      }
    } catch (e) {
      console.error("[AI design install] error:", e);
      return NextResponse.json({ error: "Gagal memasang aset ke CMS." }, { status: 500 });
    }
  }

  // ---------- Mode 1: generate aset visual CMS ----------
  const { prompt, presetId, provider: clientProvider, model: clientModel } = body as {
    prompt?: string;
    presetId?: string;
    provider?: string;
    model?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
  }
  const preset = getDesignPreset(presetId ?? "");
  if (!preset) {
    return NextResponse.json({ error: "Preset tidak dikenal" }, { status: 400 });
  }

  const providerId = clientProvider || settings.designProvider;
  const cfg = resolveImageProviderConfig(providerId);
  if (!cfg.apiKey) {
    return NextResponse.json(
      { error: `Provider desain belum dikonfigurasi. Admin perlu set ${cfg.keyEnvName} di environment variables.` },
      { status: 503 }
    );
  }

  const model = clientModel || cfg.defaultModel;
  const aspect = preset.aspectRatio as AspectRatio;
  const fullPrompt = `${prompt.trim()}. Style: ${preset.styleHint}.`;

  const startedAt = Date.now();
  const costPerImage = settings.unitCosts.DESIGN ?? 1500;
  const costEstimate = costPerImage; // DESIGN generate 1 aset per kali

  try {
    const genCfg = { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey!, model };
    const images = await generateImages(providerId, genCfg, fullPrompt, aspect, 1);

    if (images.length === 0) {
      return NextResponse.json({ error: "Provider tidak mengembalikan gambar. Coba lagi." }, { status: 502 });
    }

    // Upload ke Cloudinary folder "ai-cms" + buat MediaFile
    const uploaded: { url: string; mediaId: string; publicId: string }[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const filename = `ai_cms_${Date.now()}_${i}`;
      const { url, publicId } = await uploadToCloudinary(img.buffer, "ai-cms", filename, "image");
      const media = await db.mediaFile.create({
        data: {
          name: `AI ${preset.label}: ${prompt.trim().slice(0, 30)}${prompt.length > 30 ? "…" : ""}`,
          url,
          publicId,
          resourceType: "image",
          mimeType: img.mimeType,
          size: img.buffer.length,
          folder: "ai-cms",
          uploadedById: session.userId,
        },
      });
      uploaded.push({ url, mediaId: media.id, publicId });
    }

    const durationMs = Date.now() - startedAt;

    const job = await db.aiGenerationJob.create({
      data: {
        capability: "DESIGN",
        status: "DONE",
        provider: providerId,
        model,
        params: { prompt: prompt.trim(), presetId: preset.id, presetLabel: preset.label } as never,
        resultUrl: uploaded[0]?.url ?? null,
        resultMediaId: uploaded[0]?.mediaId ?? null,
        durationMs,
        costEstimate,
        createdBy: session.userId,
      },
    });
    await logAIUsage({
      userId: session.userId,
      capability: "DESIGN",
      provider: providerId,
      model,
      units: uploaded.length,
      costEstimate,
    });

    return NextResponse.json({ images: uploaded, jobId: job.id, preset: { id: preset.id, label: preset.label, installTarget: preset.installTarget } });
  } catch (e) {
    console.error("[AI design generate] error:", e);
    const message = e instanceof Error ? e.message : "Gagal generate aset visual.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
