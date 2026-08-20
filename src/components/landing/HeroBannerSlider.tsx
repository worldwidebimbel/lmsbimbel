"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  titleHighlight: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  alignment: string;
  overlayOpacity: number;
}

export default function HeroBannerSlider({ banners, colorPrimary }: { banners: Banner[]; colorPrimary: string }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent((c) => (c + 1) % banners.length);

  const b = banners[current];
  const isCenter = b.alignment === "center";
  const isRight = b.alignment === "right";

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "500px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full" style={{ minHeight: "500px" }}>
        {b.imageUrl ? (
          <Image src={b.imageUrl} alt={b.title} fill className="object-cover" priority sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-700" />
        )}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: b.overlayOpacity ?? 0.4 }}
        />

        <div
          className={`relative z-10 flex flex-col justify-center px-6 py-20 sm:px-12 sm:py-28 text-white ${isCenter ? "items-center text-center" : isRight ? "items-end text-right ml-auto" : "items-start text-left"}`}
          style={{ minHeight: "500px", maxWidth: "750px" }}
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            {b.title}
            {b.titleHighlight && (
              <span className="text-yellow-400"> {b.titleHighlight}</span>
            )}
          </h1>
          {b.subtitle && <p className="mt-4 text-lg text-white/90 max-w-xl">{b.subtitle}</p>}
          {b.linkUrl && (
            <a
              href={b.linkUrl}
              className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-semibold text-blue-950 bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              {b.linkLabel || "Selengkapnya"}
            </a>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/20 hover:bg-white/40 p-2 text-white backdrop-blur-sm transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/20 hover:bg-white/40 p-2 text-white backdrop-blur-sm transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-2 rounded-full transition-all"
                style={{ width: i === current ? "24px" : "8px", backgroundColor: i === current ? "#facc15" : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
