"use client";

import { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";

export default function ImageUploadButton({
  url,
  onChange,
  label = "Gambar",
  size = "sm",
}: {
  url?: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "sm" | "md";
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "questions");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (res.ok) onChange(d.url);
    } finally {
      setUploading(false);
    }
  }

  if (url) {
    return (
      <div className={`relative rounded-lg border border-gray-200 bg-white ${size === "sm" ? "h-16 w-16" : "h-24 w-24"} overflow-hidden shrink-0`}>
        <img src={url} alt="" className="h-full w-full object-cover" />
        <button type="button" onClick={() => onChange("")}
          className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <label className={`flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 ${size === "sm" ? "h-16 w-16" : "h-24 w-24"} shrink-0`}>
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      <span className="sr-only">{label}</span>
    </label>
  );
}
