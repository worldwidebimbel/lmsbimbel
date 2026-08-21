"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  titleHighlight: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export default function HeroVideoBackground({ banners, videoUrl }: { banners: Banner[]; videoUrl?: string }) {
  const [playing, setPlaying] = useState(false);
  const b = banners[0] ?? null;
  const url = videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";

  return (
    <section className="relative overflow-hidden bg-gray-900" style={{ minHeight: "500px" }}>
      {playing ? (
        <iframe
          src={`${url}${url.includes("?") ? "&" : "?"}autoplay=1&mute=1`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Hero Video"
        />
      ) : (
        <>
          {/* Video thumbnail / fallback gradient */}
          {b?.imageUrl ? (
            <img src={b.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-700" />
          )}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-28 text-center text-white" style={{ minHeight: "500px" }}>
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              {b?.title ?? "Selamat Datang"}
              {b?.titleHighlight && <span className="text-yellow-400"> {b.titleHighlight}</span>}
            </h1>
            {b?.subtitle && <p className="mt-4 text-lg text-white/90 max-w-xl">{b.subtitle}</p>}
            <button
              onClick={() => setPlaying(true)}
              className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-blue-950 shadow-lg transition-transform hover:scale-110"
            >
              <Play className="h-8 w-8 fill-current" />
            </button>
            {b?.linkUrl && (
              <a
                href={b.linkUrl}
                className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-semibold text-blue-950 bg-yellow-400 hover:bg-yellow-300 transition-colors"
              >
                {b.linkLabel || "Selengkapnya"}
              </a>
            )}
          </div>
        </>
      )}
    </section>
  );
}
