import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { logAIUsage } from "@/lib/ai-guard";
import {
  resolveProviderConfig,
  resolveImageProviderConfig,
  resolveTTSProviderConfig,
  type AIProviderId,
} from "@/lib/ai-providers";
import { generateImages } from "@/lib/ai-image-providers";
import { generateAudio, estimateDurationSec } from "@/lib/ai-tts-providers";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAISettings } from "@/lib/ai-settings";

// ============================================================
// AI Builder — Fase 4: Video Audio-Visual (composite pipeline)
// Topik → AI Writer naskah per scene (narasi + imagePrompt)
//      → AI Image per scene (paralel, limit konkuransi)
//      → TTS narasi per scene
//      → FFmpeg composite (gambar + audio + subtitle .srt burn-in
//        + fade transisi) → MP4 → Cloudinary → Material VIDEO
//
// Implementasi FFmpeg memakai child_process.execFile + ffmpeg-static
// (binary bundel — tanpa install manual di server) dengan cwd =
// folder temp job + relative paths: menghindari masalah path
// escaping filter subtitles lintas platform (Windows/Linux).
//
// Job dieksekusi async (fire-and-forget) — cocok untuk deploy
// VPS single instance + PM2 (long-running Node process).
// Progress per tahap disimpan di AiGenerationJob.params.progress.
// ============================================================

export const MAX_SCENES = 12;
export const MAX_DURATION_SEC = 300; // 5 menit
const IMAGE_CONCURRENCY = 3;
const VIDEO_W = 1280;
const VIDEO_H = 720;

export interface VideoJobRequest {
  topic: string;
  subjectName?: string;
  jenjang?: string;
  sceneCount: number;
  voice?: string;
  textProvider?: string;
  textModel?: string;
  imageProvider?: string;
  imageModel?: string;
  ttsProvider?: string;
  ttsModel?: string;
}

export interface VideoJobProgress {
  stage: "queued" | "naskah" | "gambar" | "audio" | "render" | "upload" | "done";
  current: number;
  total: number;
  message?: string;
}

interface Scene {
  narration: string;
  imagePrompt: string;
  imageBuffer?: Buffer;
  audioBuffer?: Buffer;
  audioDurationSec?: number;
}

interface VideoScript {
  title: string;
  scenes: Scene[];
}

// ---------- util ----------

function runFfmpeg(args: string[], cwd: string, timeoutMs = 180_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegStatic) {
      reject(new Error("ffmpeg binary tidak tersedia (ffmpeg-static)"));
      return;
    }
    execFile(
      ffmpegStatic,
      args,
      { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) {
          const tail = (stderr || err.message || "").slice(-500);
          reject(new Error(`ffmpeg error: ${tail}`));
        } else {
          resolve();
        }
      }
    );
  });
}

async function setProgress(jobId: string, progress: VideoJobProgress): Promise<void> {
  const job = await db.aiGenerationJob.findUnique({ where: { id: jobId }, select: { params: true } });
  const params = (job?.params as Record<string, unknown> | null) ?? {};
  await db.aiGenerationJob.update({
    where: { id: jobId },
    data: {
      status: "PROCESSING",
      params: { ...params, progress: { ...progress } } as never,
    },
  });
}

async function setFailed(jobId: string, message: string): Promise<void> {
  const job = await db.aiGenerationJob.findUnique({ where: { id: jobId }, select: { params: true } });
  const params = (job?.params as Record<string, unknown> | null) ?? {};
  await db.aiGenerationJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      errorMessage: message.slice(0, 1000),
      params: { ...params, progress: { stage: "queued", current: 0, total: 0, message: "gagal" } } as never,
    },
  });
}

function srtTime(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const milli = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(milli, 3)}`;
}

/** Buat konten .srt dari narasi — timing dibagi per kalimat proporsional panjangnya. */
function makeSrt(narration: string, durationSec: number): string {
  const sentences = narration
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return "";

  // Gabung kalimat pendek jadi cue ±max 90 karakter agar tidak terlalu cepat berganti.
  const cues: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && (buf.length + s.length) > 90) {
      cues.push(buf.trim());
      buf = s;
    } else {
      buf = buf ? `${buf} ${s}` : s;
    }
  }
  if (buf.trim()) cues.push(buf.trim());

  const totalChars = cues.reduce((a, c) => a + c.length, 0) || 1;
  let t = 0;
  const lines: string[] = [];
  cues.forEach((cue, i) => {
    const dur = Math.max(1, (cue.length / totalChars) * durationSec);
    const start = t;
    const end = t + dur;
    t = end;
    lines.push(`${i + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${cue}\n`);
  });
  return lines.join("\n");
}

// ---------- pipeline steps ----------

async function generateScript(req: VideoJobRequest): Promise<VideoScript> {
  const providerConfig = resolveProviderConfig((req.textProvider ?? "apiclaude") as AIProviderId);
  if (!providerConfig.apiKey) {
    throw new Error(`Provider teks belum dikonfigurasi (${providerConfig.keyEnvName}).`);
  }
  const model = req.textModel || providerConfig.defaultModel;

  const systemPrompt =
    "You are an expert educational video script writer for Indonesian bimbel content. Write in Bahasa Indonesia. Return ONLY a valid JSON object, no markdown, no code fences.";

  const userPrompt = `Create a script for an educational video with these specifications:
- Topic: ${req.topic.trim()}
- Subject: ${req.subjectName?.trim() || "Umum"}
- Education level: ${req.jenjang?.trim() || "Umum"}
- Number of scenes: exactly ${req.sceneCount}
- Each scene narration: 2-4 sentences, natural spoken Bahasa Indonesia (about 40-60 words)
- Language: Bahasa Indonesia for ALL narration

Return a JSON object with EXACTLY these keys:
- "title": judul video yang ringkas dan menarik
- "scenes": array of exactly ${req.sceneCount} objects, each with:
  - "narration": teks narasi voice-over scene tersebut (Bahasa Indonesia lisan, mengalir)
  - "imagePrompt": detailed ENGLISH prompt for generating an educational illustration for that scene (describe the visual clearly)`;

  const res = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
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

  if (!res.ok) {
    const errText = await res.text();
    console.error("[AI video] naskah error:", errText);
    throw new Error("Gagal membuat naskah video (AI Writer).");
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed?.title || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      throw new Error("missing keys");
    }
    let scenes: Scene[] = parsed.scenes
      .filter((s: { narration?: string }) => s?.narration?.trim())
      .slice(0, MAX_SCENES)
      .map((s: { narration: string; imagePrompt?: string }) => ({
        narration: String(s.narration).trim(),
        imagePrompt: String(s.imagePrompt ?? s.narration).trim(),
      }));

    if (scenes.length === 0) throw new Error("no scenes");

    // Guardrail durasi ≤ 5 menit — buang scene dari belakang bila estimasi kelebihan.
    const totalDur = () => scenes.reduce((a, s) => a + estimateDurationSec(s.narration), 0);
    while (scenes.length > 1 && totalDur() > MAX_DURATION_SEC) {
      scenes = scenes.slice(0, -1);
    }
    if (totalDur() > MAX_DURATION_SEC + 60) {
      throw new Error(`Naskah terlalu panjang (estimasi ${Math.round(totalDur())}s, maks ${MAX_DURATION_SEC}s).`);
    }
    return { title: String(parsed.title), scenes };
  } catch {
    throw new Error("Format naskah AI tidak valid. Coba lagi.");
  }
}

// ---------- pipeline utama ----------

/**
 * Jalankan pipeline video untuk satu job. Dipanggil async (tanpa await)
 * oleh POST /api/ai/video — aman untuk long-running Node (VPS + PM2).
 */
export async function runVideoPipeline(jobId: string, req: VideoJobRequest, userId: string): Promise<void> {
  const workDir = path.join(os.tmpdir(), `ai-video-${jobId}`);
  let script: VideoScript | null = null;
  const startedAt = Date.now();

  try {
    await fs.mkdir(workDir, { recursive: true });

    // ---- Step 1: naskah per scene ----
    await setProgress(jobId, { stage: "naskah", current: 0, total: req.sceneCount, message: "Menulis naskah per scene..." });
    script = await generateScript(req);
    const scenes = script.scenes;
    await setProgress(jobId, { stage: "naskah", current: scenes.length, total: scenes.length, message: `Naskah siap: "${script.title}" (${scenes.length} scene)` });

    // ---- Step 2: gambar per scene (paralel, limit konkuransi) ----
    const imageProviderId = req.imageProvider ?? "openai";
    const imageCfg = resolveImageProviderConfig(imageProviderId);
    if (!imageCfg.apiKey) throw new Error(`Provider gambar belum dikonfigurasi (${imageCfg.keyEnvName}).`);
    const imageModel = req.imageModel || imageCfg.defaultModel;
    const imageGenCfg = { baseUrl: imageCfg.baseUrl, apiKey: imageCfg.apiKey!, model: imageModel };

    let imageDone = 0;
    async function renderSceneImage(i: number): Promise<void> {
      const imgs = await generateImages(imageProviderId, imageGenCfg, scenes[i].imagePrompt, "16:9", 1);
      if (!imgs[0]) throw new Error(`Gagal generate gambar scene ${i + 1}.`);
      scenes[i].imageBuffer = imgs[0].buffer;
      imageDone++;
      await setProgress(jobId, { stage: "gambar", current: imageDone, total: scenes.length, message: `Gambar scene ${imageDone}/${scenes.length}` });
    }

    for (let i = 0; i < scenes.length; i += IMAGE_CONCURRENCY) {
      await Promise.all(
        scenes.slice(i, i + IMAGE_CONCURRENCY).map((_, j) => renderSceneImage(i + j))
      );
    }

    // ---- Step 3: TTS per scene ----
    const ttsProviderId = req.ttsProvider ?? "openai";
    const ttsCfg = resolveTTSProviderConfig(ttsProviderId);
    if (!ttsCfg.apiKey) throw new Error(`Provider TTS belum dikonfigurasi (${ttsCfg.keyEnvName}).`);
    const ttsModel = req.ttsModel || ttsCfg.defaultModel;
    const ttsGenCfg = { baseUrl: ttsCfg.baseUrl, apiKey: ttsCfg.apiKey!, model: ttsModel };

    for (let i = 0; i < scenes.length; i++) {
      const audio = await generateAudio(ttsProviderId, ttsGenCfg, scenes[i].narration, req.voice ?? "", 1);
      scenes[i].audioBuffer = audio.buffer;
      scenes[i].audioDurationSec = audio.durationSec;
      await setProgress(jobId, { stage: "audio", current: i + 1, total: scenes.length, message: `Narasi scene ${i + 1}/${scenes.length}` });
    }

    // ---- Step 4: FFmpeg composite per scene + concat ----
    // Tulis file scene (relative paths — ffmpeg dijalankan dengan cwd workDir,
    // menghindari escaping path filter subtitles lintas platform).
    for (let i = 0; i < scenes.length; i++) {
      await fs.writeFile(path.join(workDir, `scene_${i}.png`), scenes[i].imageBuffer!);
      await fs.writeFile(path.join(workDir, `scene_${i}.mp3`), scenes[i].audioBuffer!);
      await fs.writeFile(path.join(workDir, `scene_${i}.srt`), makeSrt(scenes[i].narration, scenes[i].audioDurationSec!));
    }

    for (let i = 0; i < scenes.length; i++) {
      const dur = scenes[i].audioDurationSec!;
      const fadeOutStart = Math.max(0, dur - 0.5).toFixed(2);
      const audioFadeOutStart = Math.max(0, dur - 0.3).toFixed(2);
      await runFfmpeg(
        [
          "-y",
          "-loop", "1", "-i", `scene_${i}.png`,
          "-i", `scene_${i}.mp3`,
          "-vf",
          `scale=${VIDEO_W}:${VIDEO_H}:force_original_aspect_ratio=decrease,pad=${VIDEO_W}:${VIDEO_H}:(ow-iw)/2:(oh-ih)/2,` +
            `fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOutStart}:d=0.5,` +
            `subtitles=scene_${i}.srt:force_style='FontSize=18,Outline=1,MarginV=30'`,
          "-af",
          `afade=t=in:st=0:d=0.2,afade=t=out:st=${audioFadeOutStart}:d=0.3`,
          "-c:v", "libx264", "-tune", "stillimage", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "192k",
          "-shortest",
          `scene_${i}.mp4`,
        ],
        workDir
      );
      await setProgress(jobId, { stage: "render", current: i + 1, total: scenes.length, message: `Render scene ${i + 1}/${scenes.length}` });
    }

    // Concat semua scene (-c copy: semua scene sudah encode konsisten)
    const listContent = scenes.map((_, i) => `file 'scene_${i}.mp4'`).join("\n");
    await fs.writeFile(path.join(workDir, "list.txt"), listContent);
    await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "video.mp4"], workDir);

    // ---- Step 5: upload → Cloudinary → MediaFile → Material VIDEO ----
    await setProgress(jobId, { stage: "upload", current: 0, total: 1, message: "Mengunggah video..." });
    const mp4Buffer = await fs.readFile(path.join(workDir, "video.mp4"));
    const totalDurationSec = scenes.reduce((a, s) => a + (s.audioDurationSec ?? 0), 0);
    const filename = `ai_video_${Date.now()}`;
    const { url, publicId } = await uploadToCloudinary(mp4Buffer, "ai-materials", filename, "video");
    const media = await db.mediaFile.create({
      data: {
        name: `AI Video: ${script.title.slice(0, 40)}`,
        url,
        publicId,
        resourceType: "video",
        mimeType: "video/mp4",
        size: mp4Buffer.length,
        folder: "ai-materials",
        uploadedById: userId,
      },
    });

    const material = await db.material.create({
      data: {
        title: script.title,
        description: `Video pembelajaran AI — ${req.topic.trim()}`,
        uploaderId: userId,
        type: "VIDEO",
        fileUrl: url,
        duration: Math.round(totalDurationSec),
        order: 0,
        isPublished: false, // draft — guru review dulu
      },
    });

    const durationMs = Date.now() - startedAt;
    const settings = await getAISettings();
    const costEstimate = settings.unitCosts.VIDEO ?? 8000;

    await db.aiGenerationJob.update({
      where: { id: jobId },
      data: {
        status: "DONE",
        resultUrl: url,
        resultMediaId: media.id,
        resultMaterialId: material.id,
        durationMs,
        params: {
          request: req,
          progress: { stage: "done", current: scenes.length, total: scenes.length, message: `${scenes.length} scene • ${Math.round(totalDurationSec)}s` } as never,
          title: script.title,
          sceneCount: scenes.length,
          totalDurationSec: Math.round(totalDurationSec),
        } as never,
      },
    });
    await logAIUsage({ userId, capability: "VIDEO", provider: "composite", model: "pipeline", units: 1, costEstimate });
    await logAudit({ entity: "Material", entityId: material.id, action: "CREATE", after: { title: script.title, type: "VIDEO", source: "ai-builder-video" } });
  } catch (e) {
    console.error("[AI video pipeline] error:", e);
    const message = e instanceof Error ? e.message : "Pipeline video gagal.";
    await setFailed(jobId, message).catch(() => undefined);
  } finally {
    // Bersihkan folder temp
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
