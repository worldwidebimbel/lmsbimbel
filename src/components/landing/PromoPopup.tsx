"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";

interface Config {
  popupTitle: string;
  popupMessage: string;
  popupLinkUrl: string;
  popupLinkLabel: string;
  colorPrimary: string;
}

export default function PromoPopup({ config }: { config: Config }) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-4">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="h-12 w-12 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${config.colorPrimary}20` }}>
          <span className="text-2xl">🎉</span>
        </div>
        {config.popupTitle && <h3 className="text-xl font-bold text-gray-900">{config.popupTitle}</h3>}
        {config.popupMessage && <p className="text-gray-600">{config.popupMessage}</p>}
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
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
