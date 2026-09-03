"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  category: string;
}

export default function VideoGalleryClient({ videos, categories }: { videos: Video[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [playing, setPlaying] = useState<string | null>(null);

  const filtered = activeCategory === "Semua" ? videos : videos.filter((v) => v.category === activeCategory);

  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return url;
  };

  return (
    <div className="mt-8">
      {/* Category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("Semua")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === "Semua" ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === cat ? "bg-blue-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-black">
              {playing === v.id ? (
                <iframe src={getEmbedUrl(v.videoUrl)} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen title={v.title} />
              ) : (
                <>
                  {v.thumbnailUrl && (
                    <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  )}
                  <button
                    onClick={() => setPlaying(v.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-blue-950">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </button>
                </>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900">{v.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{v.category} · {v.duration ?? "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Belum ada video.
        </div>
      )}
    </div>
  );
}
