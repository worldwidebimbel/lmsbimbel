"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { cn, getTierColor, getTierLabel } from "@/lib/utils";
import type { FeatureFlag } from "@/types";
import {
  Users, CalendarDays, BookOpen, ClipboardList, FileCheck,
  CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, Mail, MessageCircle, MessagesSquare, MessageSquare,
  Video, Gamepad2, Award, Users2, Smartphone, Database, Trophy,
  QrCode, ToggleLeft, ToggleRight, Loader2, Search, Filter,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Users, CalendarDays, BookOpen, ClipboardList, FileCheck,
  CheckSquare, GraduationCap, BarChart3, Wallet, CreditCard,
  Megaphone, Mail, MessageCircle, MessagesSquare, MessageSquare,
  Video, Gamepad2, Award, Users2, Smartphone, Database, Trophy,
  QrCode,
};

interface FeatureControlPanelProps {
  flagsByCategory: Record<string, FeatureFlag[]>;
  categoryLabels: Record<string, string>;
}

const TIER_OPTIONS = ["Semua", "BASIC", "STANDARD", "PREMIUM"];

export function FeatureControlPanel({ flagsByCategory, categoryLabels }: FeatureControlPanelProps) {
  const { refreshFlags } = useFeatureFlags();
  const [isPending, startTransition] = useTransition();
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>(
    Object.values(flagsByCategory).flat().reduce((acc, f) => {
      acc[f.code] = f.isActive;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("Semua");

  async function handleToggle(code: string, currentValue: boolean) {
    setLoadingCode(code);
    const newValue = !currentValue;

    // Optimistic update
    setLocalFlags((prev) => ({ ...prev, [code]: newValue }));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/features/${code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newValue }),
        });

        if (!res.ok) throw new Error();

        toast.success(newValue ? "Fitur diaktifkan" : "Fitur dinonaktifkan", {
          description: code,
        });
        await refreshFlags();
      } catch {
        // Revert on error
        setLocalFlags((prev) => ({ ...prev, [code]: currentValue }));
        toast.error("Gagal mengubah status fitur");
      } finally {
        setLoadingCode(null);
      }
    });
  }

  const allFlags = Object.values(flagsByCategory).flat();
  const filteredFlags = allFlags.filter((flag) => {
    const matchSearch = flag.name.toLowerCase().includes(search.toLowerCase()) ||
      flag.description.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "Semua" || flag.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const filteredByCategory: Record<string, FeatureFlag[]> = {};
  filteredFlags.forEach((flag) => {
    if (!filteredByCategory[flag.category]) filteredByCategory[flag.category] = [];
    filteredByCategory[flag.category].push(flag);
  });

  const activeCount = Object.values(localFlags).filter(Boolean).length;
  const totalCount = allFlags.length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Fitur Aktif</span>
          <span className="text-sm text-gray-500">{activeCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(activeCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari fitur..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-1">
            {TIER_OPTIONS.map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={cn(
                  "px-3 py-2 text-xs font-medium rounded-lg transition-all",
                  tierFilter === tier
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                )}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Sections */}
      {Object.entries(filteredByCategory).map(([category, flags]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              {categoryLabels[category] ?? category}
            </h3>
            <span className="text-xs text-gray-500">
              {flags.filter((f) => localFlags[f.code]).length}/{flags.length} aktif
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {flags.map((flag) => {
              const Icon = ICON_MAP[flag.icon ?? ""] ?? ToggleLeft;
              const isActive = localFlags[flag.code] ?? flag.isActive;
              const isLoading = loadingCode === flag.code;

              return (
                <div
                  key={flag.code}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-colors",
                    isActive ? "bg-white" : "bg-gray-50/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-blue-50" : "bg-gray-100"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-500")} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-medium", isActive ? "text-gray-900" : "text-gray-500")}>
                        {flag.name}
                      </span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold border", getTierColor(flag.tier))}>
                        {getTierLabel(flag.tier)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{flag.description}</p>
                    {flag.affectedRoles.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {flag.affectedRoles.map((role) => (
                          <span key={role} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {role.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(flag.code, isActive)}
                    disabled={isLoading || isPending}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60",
                      isActive ? "bg-blue-600" : "bg-gray-200"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                          isActive ? "translate-x-5.5" : "translate-x-0.5"
                        )}
                        style={{ transform: isActive ? "translateX(22px)" : "translateX(2px)" }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(filteredByCategory).length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Tidak ada fitur yang sesuai filter</p>
        </div>
      )}
    </div>
  );
}
