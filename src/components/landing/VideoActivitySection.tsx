"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Zap, Globe, Users, TrendingUp, ArrowRight } from "lucide-react";

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  isFeatured: boolean;
}

interface VideoHighlight {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  theme: string;
}

const HIGHLIGHT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Globe,
  Users,
  TrendingUp,
};

export default function VideoActivitySection({ videos, highlights }: { videos: Video[]; highlights: VideoHighlight[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const featured = videos.find((v) => v.isFeatured) ?? videos[0];

  if (!featured) return null;

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return url;
  };

  return (
    <section className="relative overflow-hidden bg-gray-50 py-20">
      {/* Decorative dot pattern */}
      <div className="absolute right-0 top-0 h-40 w-40 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #1e3a8a 2px, transparent 2px)", backgroundSize: "20px 20px" }} />

      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
            <Play className="h-4 w-4" /> VIDEO ACTIVITY
          </span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            <span className="text-blue-900">Aktif &amp; </span>
            <span className="text-yellow-500">Kreatif</span>
          </h2>
          <p className="mt-3 text-gray-500">Lihat keseruan kegiatan pembelajaran kami</p>
        </div>

        {/* Video player */}
        <div className="mx-auto max-w-4xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
            {playing ? (
              <iframe
                src={getEmbedUrl(playing)}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Video player"
              />
            ) : (
              <>
                {featured.thumbnailUrl && (
                  <Image
                    src={featured.thumbnailUrl}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 1024px"
                  />
                )}
                <button
                  onClick={() => setPlaying(featured.videoUrl)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/20"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-blue-950 shadow-lg transition-transform hover:scale-110">
                    <Play className="h-8 w-8 fill-current" />
                  </div>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="text-lg font-semibold text-white">{featured.title}</h3>
                  {featured.duration && <span className="text-sm text-white/70">{featured.duration}</span>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Highlight cards */}
        {highlights.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.slice(0, 4).map((h) => {
              const Icon = HIGHLIGHT_ICONS[h.icon ?? "Zap"] ?? Zap;
              const isYellow = h.theme === "yellow";
              return (
                <div
                  key={h.id}
                  className={`rounded-xl p-5 ${isYellow ? "bg-yellow-50 border border-yellow-200" : "bg-blue-50 border border-blue-200"}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isYellow ? "bg-yellow-400 text-blue-950" : "bg-blue-900 text-white"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 font-bold text-gray-900">{h.title}</h4>
                  {h.description && <p className="mt-1 text-sm text-gray-600">{h.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-md sm:flex-row">
          <div className="flex items-center gap-3">
            <Play className="h-8 w-8 text-blue-900" />
            <div>
              <h3 className="font-bold text-gray-900">Tonton video lainnya</h3>
              <p className="text-sm text-gray-500">Lihat lebih banyak kegiatan kami</p>
            </div>
          </div>
          <Link
            href="/galeri/video"
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 transition-colors hover:bg-yellow-300"
          >
            TONTON VIDEO LAINNYA <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
