"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { readableTextColor } from "@/lib/readable-text";

interface Config {
  popupTitle: string;
  popupMessage: string;
  popupLinkUrl: string;
  popupLinkLabel: string;
  colorPrimary: string;
  popupMode?: string;
  popupBgColor?: string;
  popupBgImage?: string;
}

export default function PromoPopup({ config }: { config: Config }) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  const rawMode = config.popupMode || "light";
  const bgImage = (config.popupBgImage ?? "").trim();
  const mode = (rawMode === "image" || rawMode === "image_only") && !bgImage ? "dark" : rawMode;
  const isImageOnly = mode === "image_only";
  const isImage = mode === "image" || mode === "image_only";
  const bgColor = (config.popupBgColor ?? "").trim() || (mode === "dark" ? "#000000" : "#FFFFFF");
  const darkSurface = isImage || readableTextColor(bgColor) === "#ffffff";
  const textColor = darkSurface ? "#ffffff" : "#111827";
  const subTextColor = darkSurface ? "rgba(255,255,255,0.75)" : "rgba(17,24,39,0.7)";
  const closeBtnClass = darkSurface ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-600";

  if (isImageOnly) {
    return (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <div className="relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden bg-black">
          {config.popupLinkUrl ? (
            <a href={config.popupLinkUrl} className="block">
              <img src={bgImage} alt="Promo" className="block w-full h-auto" />
            </a>
          ) : (
            <img src={bgImage} alt="Promo" className="block w-full h-auto" />
          )}
          <button
            onClick={() => setOpen(false)}
            className={`absolute top-3 right-3 z-10 rounded-full bg-black/40 p-1.5 backdrop-blur-sm ${closeBtnClass}`}
            aria-label="Tutup popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="relative rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-4 overflow-hidden"
        style={isImage ? undefined : { backgroundColor: bgColor }}
      >
        {isImage && (
          <>
            <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <button
          onClick={() => setOpen(false)}
          className={`absolute top-4 right-4 z-10 ${closeBtnClass}`}
          aria-label="Tutup popup"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative space-y-4 text-center">
          <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${config.colorPrimary}20` }}>
            <span className="text-2xl">🎉</span>
          </div>
          {config.popupTitle && <h3 className="text-xl font-bold" style={{ color: textColor }}>{config.popupTitle}</h3>}
          {config.popupMessage && <p style={{ color: subTextColor }}>{config.popupMessage}</p>}
          <div className="flex gap-3 justify-center">
            {config.popupLinkUrl && (
              <a
                href={config.popupLinkUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: config.colorPrimary }}
              >
                {config.popupLinkLabel || "Selengkapnya"} <ArrowRight className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => setOpen(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium ${
                darkSurface
                  ? "border border-white/40 text-white hover:bg-white/10"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
