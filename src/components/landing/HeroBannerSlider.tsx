"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
}

export default function HeroBannerSlider({ banners, colorPrimary }: { banners: Banner[]; colorPrimary: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const prev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent((c) => (c + 1) % banners.length);

  const b = banners[current];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
      <div className="relative w-full h-full" style={{ minHeight: "420px" }}>
        {b.imageUrl ? (
          <img src={b.imageUrl} alt={b.title} className="w-full object-cover absolute inset-0" style={{ height: "100%", minHeight: "420px" }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-500" />
        )}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-6 py-20 sm:py-28" style={{ minHeight: "420px" }}>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-3xl">{b.title}</h1>
          {b.subtitle && <p className="mt-4 text-lg text-white/90 max-w-2xl">{b.subtitle}</p>}
          {b.linkUrl && (
            <a
              href={b.linkUrl}
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3 text-base font-semibold text-white border-2 border-white hover:bg-white/20 transition-colors"
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
                style={{ width: i === current ? "24px" : "8px", backgroundColor: i === current ? colorPrimary : "rgba(255,255,255,0.5)" }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
