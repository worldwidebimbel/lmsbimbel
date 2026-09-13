"use client";

import { useMemo, useState } from "react";
import { LUCIDE_ICON_MAP, LUCIDE_ICON_OPTIONS, getLucideIcon } from "@/lib/lucide-icon-map";
import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export default function LucideIconPicker({ value, onChange, label }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return LUCIDE_ICON_OPTIONS;
    return LUCIDE_ICON_OPTIONS.filter((name) => name.toLowerCase().includes(q));
  }, [search]);

  const SelectedIcon = getLucideIcon(value);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label ?? "Icon"}</label>

      {/* Preview icon terpilih */}
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <SelectedIcon className="h-5 w-5 text-blue-700" />
        <span className="text-sm font-medium text-blue-700">{value || "Belum dipilih"}</span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari icon... (mis. phone, book, star)"
          className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Grid icon */}
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
          {filtered.map((name) => {
            const Icon = LUCIDE_ICON_MAP[name];
            const isSelected = value === name;
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => onChange(name)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white ring-2 ring-blue-300"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-gray-400">
            Icon tidak ditemukan. Coba kata kunci lain.
          </p>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {filtered.length} dari {LUCIDE_ICON_OPTIONS.length} icon
      </p>
    </div>
  );
}
