"use client";

import { useState } from "react";
import { Pencil, ListFilter } from "lucide-react";

const CUSTOM_SENTINEL = "__CUSTOM__";

/**
 * A dropdown that also allows typing a custom value.
 * Useful when the predefined list may become outdated (e.g. curriculum names,
 * grade levels, languages) so users are never blocked by a missing option.
 */
export default function SelectOrCustom({
  value,
  onChange,
  options,
  placeholder = "Ketik nilai sendiri...",
  label,
  className = "",
  selectClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  className?: string;
  selectClassName?: string;
}) {
  // Start in custom mode when the current value isn't part of the list.
  const [isCustom, setIsCustom] = useState(value !== "" && !options.includes(value));

  function handleSelectChange(next: string) {
    if (next === CUSTOM_SENTINEL) {
      setIsCustom(true);
      onChange("");
    } else {
      onChange(next);
    }
  }

  function backToList() {
    setIsCustom(false);
    onChange(options[0] ?? "");
  }

  const baseInput =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>}

      {isCustom ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseInput}
          />
          <button
            type="button"
            onClick={backToList}
            title="Kembali ke daftar pilihan"
            className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
          >
            <ListFilter className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => handleSelectChange(e.target.value)}
          className={`${baseInput} ${selectClassName}`}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={CUSTOM_SENTINEL}>✏️ Ketik sendiri...</option>
        </select>
      )}
    </div>
  );
}

export { CUSTOM_SENTINEL };
