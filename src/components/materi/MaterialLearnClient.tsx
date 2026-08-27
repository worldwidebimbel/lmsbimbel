"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, CheckCircle2, Lightbulb, ExternalLink, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { ArticleRenderer } from "./ArticleRenderer";

function toEmbedUrl(url: string): string {
  const watch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

interface Props {
  materialId: string;
  studentId: string;
  type: string;
  fileUrl: string | null;
  content: string | null;
  keyPoints: string[];
  tips: string | null;
  slideCount: number | null;
  fileName?: string | null;
  isCompleted: boolean;
  prevHref: string | null;
  nextHref: string | null;
  nextLabel: string | null;
}

export default function MaterialLearnClient({
  materialId, studentId, type, fileUrl, content, keyPoints, tips, slideCount, fileName,
  isCompleted: initialCompleted, prevHref, nextHref, nextLabel,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function markDone() {
    if (completed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/materi/${materialId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, isCompleted: true }),
      });
      if (res.ok) { setCompleted(true); toast.success("Materi ditandai selesai"); }
      else toast.error("Gagal menyimpan progress");
    } finally {
      setLoading(false);
    }
  }

  const isVideo = type === "VIDEO" || type === "YOUTUBE";
  const isArticle = type === "TEXT";
  const isSlide = type === "PRESENTATION";
  const embedUrl = fileUrl ? toEmbedUrl(fileUrl) : null;
  const isIframeEmbed = embedUrl && (embedUrl.includes("youtube.com/embed") || embedUrl.includes("player.vimeo.com") || embedUrl.includes("docs.google.com") || embedUrl.includes("officeapps.live.com"));

  return (
    <div className="space-y-6">
      {/* Header row: Tandai Selesai */}
      <div className="flex justify-end">
        {completed ? (
          <span className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-600">
            <CheckCircle className="h-4 w-4" /> Materi Selesai
          </span>
        ) : (
          <button
            onClick={markDone}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Tandai Selesai
          </button>
        )}
      </div>

      {/* VIDEO VIEW */}
      {isVideo && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900">
            {fileUrl && isIframeEmbed ? (
              <iframe
                src={embedUrl!}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : fileUrl ? (
              <video src={fileUrl} controls className="aspect-video w-full bg-black" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center text-sm text-gray-400">
                Video belum tersedia
              </div>
            )}
          </div>

          <InfoBoxes heading="Video ini membahas:" keyPoints={keyPoints} tips={tips} />

          {content && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">Ringkasan Materi Video</h3>
              <ArticleRenderer content={content} />
            </div>
          )}
        </div>
      )}

      {/* ARTICLE VIEW */}
      {isArticle && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {content ? <ArticleRenderer content={content} /> : (
            <p className="text-sm text-gray-400">Konten artikel belum tersedia.</p>
          )}
        </div>
      )}

      {/* PRESENTATION / PPT VIEW */}
      {isSlide && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-xs text-gray-300">
              <span className="truncate">{fileName ?? "Materi Presentasi.pptx"}</span>
              <div className="flex items-center gap-3">
                {slideCount && <span>1 / {slideCount}</span>}
                {fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
            </div>
            {fileUrl ? (
              <iframe src={embedUrl!} className="aspect-[16/10] w-full bg-white" allowFullScreen />
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center text-sm text-gray-400">
                Slide belum tersedia
              </div>
            )}
          </div>

          <InfoBoxes heading="Setelah mempelajari materi ini, kamu akan:" keyPoints={keyPoints} tips={tips} />
        </div>
      )}

      {/* FALLBACK: PDF / DOCUMENT / LINK */}
      {!isVideo && !isArticle && !isSlide && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          {content && <ArticleRenderer content={content} />}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4" /> Buka Materi
            </a>
          )}
        </div>
      )}

      {/* Bottom navigation */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        {prevHref ? (
          <Link href={prevHref} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Materi Sebelumnya
          </Link>
        ) : (
          <Link href="/siswa/materi" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Rangkaian Aktivitas
          </Link>
        )}
        {nextHref && (
          <Link href={nextHref} className="flex items-center gap-1.5 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            {nextLabel ?? "Materi Berikutnya"} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function InfoBoxes({ heading, keyPoints, tips }: { heading: string; keyPoints: string[]; tips: string | null }) {
  if (keyPoints.length === 0 && !tips) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {keyPoints.length > 0 && (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" /> {heading}
          </p>
          <ul className="space-y-1">
            {keyPoints.map((kp, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-green-700">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" /> {kp}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tips && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <Lightbulb className="h-4 w-4" /> Tips Belajar
          </p>
          <p className="text-xs text-amber-700">{tips}</p>
        </div>
      )}
    </div>
  );
}
