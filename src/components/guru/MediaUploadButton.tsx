"use client";

import { useState } from "react";
import { Upload, Loader2, X, Youtube, Music, Video, Image as ImageIcon, Link2 } from "lucide-react";

export type MediaType = "image" | "audio" | "video" | "youtube" | "none";

export interface MediaValue {
  type: MediaType;
  url: string;
}

function detectMediaType(url: string): MediaType {
  if (!url) return "none";
  if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) return "youtube";
  if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)) return "audio";
  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url)) return "image";
  return "none";
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function parseMediaFromContent(content: string): MediaValue {
  const imgMatch = content.match(/<img\s+src="([^"]+)"/);
  if (imgMatch) return { type: "image", url: imgMatch[1] };

  const audioMatch = content.match(/<audio[^>]*src="([^"]+)"/);
  if (audioMatch) return { type: "audio", url: audioMatch[1] };

  const videoMatch = content.match(/<video[^>]*src="([^"]+)"/);
  if (videoMatch) return { type: "video", url: videoMatch[1] };

  const ytMatch = content.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: "youtube", url: `https://www.youtube.com/watch?v=${ytMatch[1]}` };

  return { type: "none", url: "" };
}

export function mediaToHtml(media: MediaValue): string {
  if (!media.url) return "";
  switch (media.type) {
    case "image":
      return `<img src="${media.url}" alt="Media soal" class="max-h-48 rounded-lg" />`;
    case "audio":
      return `<audio controls src="${media.url}" class="w-full"></audio>`;
    case "video":
      return `<video controls src="${media.url}" class="max-h-64 rounded-lg w-full"></video>`;
    case "youtube": {
      const ytId = extractYouTubeId(media.url);
      if (!ytId) return "";
      return `<iframe width="100%" height="240" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen class="rounded-lg"></iframe>`;
    }
    default:
      return "";
  }
}

export function stripMediaFromContent(content: string): string {
  return content
    .replace(/<img[^>]*>/g, "")
    .replace(/<audio[^>]*>[\s\S]*?<\/audio>/g, "")
    .replace(/<video[^>]*>[\s\S]*?<\/video>/g, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/g, "")
    .replace(/\n\s*\n+$/, "")
    .trim();
}

export default function MediaUploadButton({
  value,
  onChange,
  label = "Media",
  size = "md",
}: {
  value: MediaValue;
  onChange: (val: MediaValue) => void;
  label?: string;
  size?: "sm" | "md";
}) {
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, accept: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setShowMenu(false);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "questions");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) {
        const detected: MediaType = accept.includes("audio") ? "audio" : accept.includes("video") ? "video" : "image";
        onChange({ type: detected, url: d.url });
      }
    } finally {
      setUploading(false);
    }
  }

  function handleLinkSubmit() {
    if (!linkUrl.trim()) return;
    const detected = detectMediaType(linkUrl);
    onChange({ type: detected === "none" ? "youtube" : detected, url: linkUrl.trim() });
    setLinkUrl("");
    setShowLinkInput(false);
    setShowMenu(false);
  }

  if (value.url) {
    return (
      <div className={`relative rounded-lg border border-gray-200 bg-white overflow-hidden shrink-0 ${size === "sm" ? "w-20" : "w-32"}`}>
        <div className="flex flex-col items-center justify-center p-2 gap-1">
          {value.type === "image" && <img src={value.url} alt="" className="h-16 w-full object-cover rounded" />}
          {value.type === "audio" && (
            <div className="flex flex-col items-center gap-1 w-full">
              <Music className="h-5 w-5 text-purple-500" />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">Audio</span>
            </div>
          )}
          {value.type === "video" && (
            <div className="flex flex-col items-center gap-1 w-full">
              <Video className="h-5 w-5 text-blue-500" />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">Video</span>
            </div>
          )}
          {value.type === "youtube" && (
            <div className="flex flex-col items-center gap-1 w-full">
              <Youtube className="h-5 w-5 text-red-500" />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">YouTube</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange({ type: "none", url: "" })}
          className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <label
        className={`flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 ${
          size === "sm" ? "h-16 w-16" : "h-24 w-24"
        }`}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "image/*")} disabled={uploading} />
        <span className="sr-only">{label}</span>
      </label>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[8px] font-medium text-white hover:bg-indigo-600"
      >
        + lainnya
      </button>
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 z-30 w-44 rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => { setShowMenu(false); setShowLinkInput(true); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-left"
          >
            <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube Link
          </button>
          <label className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer text-left">
            <Music className="h-3.5 w-3.5 text-purple-500" /> Upload Audio
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFile(e, "audio/*")} />
          </label>
          <label className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer text-left">
            <Video className="h-3.5 w-3.5 text-blue-500" /> Upload Video
            <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e, "video/*")} />
          </label>
          <label className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer text-left">
            <ImageIcon className="h-3.5 w-3.5 text-green-500" /> Upload Gambar
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "image/*")} />
          </label>
          <button
            type="button"
            onClick={() => { setShowMenu(false); setShowLinkInput(true); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 text-left"
          >
            <Link2 className="h-3.5 w-3.5 text-gray-500" /> Link URL Media
          </button>
        </div>
      )}
      {showLinkInput && (
        <div className="absolute top-full left-0 mt-1 z-30 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste URL (YouTube/audio/video)"
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleLinkSubmit())}
          />
          <div className="flex gap-1 mt-1">
            <button
              type="button"
              onClick={handleLinkSubmit}
              className="flex-1 rounded bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-600"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => { setShowLinkInput(false); setLinkUrl(""); }}
              className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
