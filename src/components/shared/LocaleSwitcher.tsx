"use client";

import { useLocaleStore } from "@/lib/locale-store";
import { DollarSign, Languages, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LocaleSwitcher() {
  const { currency, locale, setCurrency, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        <Languages className="h-3.5 w-3.5" />
        <span>{locale === "id" ? "ID" : "EN"}</span>
        <span className="text-gray-300">|</span>
        <DollarSign className="h-3.5 w-3.5" />
        <span>{currency}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Bahasa</p>
            <div className="flex gap-2">
              <button
                onClick={() => setLocale("id")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${locale === "id" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {locale === "id" && <Check className="inline h-3 w-3 mr-1" />}ID
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${locale === "en" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {locale === "en" && <Check className="inline h-3 w-3 mr-1" />}EN
              </button>
            </div>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Mata Uang</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrency("IDR")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${currency === "IDR" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {currency === "IDR" && <Check className="inline h-3 w-3 mr-1" />}IDR
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium ${currency === "USD" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {currency === "USD" && <Check className="inline h-3 w-3 mr-1" />}USD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
