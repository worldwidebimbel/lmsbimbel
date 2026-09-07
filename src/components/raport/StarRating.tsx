"use client";

import { Star } from "lucide-react";

const SIZE_MAP = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
} as const;

export function StarRating({
  value,
  max = 5,
  size = "md",
}: {
  value: number | null | undefined;
  max?: number;
  size?: keyof typeof SIZE_MAP;
}) {
  const filled = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${filled} dari ${max} bintang`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`${SIZE_MAP[size]} ${i < filled ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

export function StarPicker({
  value,
  onChange,
  max = 5,
  size = "lg",
  allowClear = true,
  label,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  max?: number;
  size?: keyof typeof SIZE_MAP;
  allowClear?: boolean;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label={label ?? "Pilih bintang"}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const active = (value ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} bintang`}
            onClick={() => onChange(allowClear && value === star ? null : star)}
            className="max-md:min-h-[44px] max-md:min-w-[44px] inline-flex items-center justify-center rounded p-0.5 transition hover:scale-110"
          >
            <Star
              className={`${SIZE_MAP[size]} ${active ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function CategoryBadge({
  category,
  colorHex,
  className = "",
}: {
  category: string | null | undefined;
  colorHex?: string | null;
  className?: string;
}) {
  if (!category) return null;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${className}`}
      style={
        colorHex
          ? { color: colorHex, backgroundColor: `${colorHex}1a` }
          : { color: "#1e3a8a", backgroundColor: "#1e3a8a1a" }
      }
    >
      {category}
    </span>
  );
}
