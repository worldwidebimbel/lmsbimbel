"use client";

import { useFeatureFlags } from "@/context/FeatureFlagContext";

export function useFeature(code: string): boolean {
  const { isFeatureActive } = useFeatureFlags();
  return isFeatureActive(code);
}

export function useFeatureMultiple(codes: string[]): Record<string, boolean> {
  const { isFeatureActive } = useFeatureFlags();
  return codes.reduce(
    (acc, code) => {
      acc[code] = isFeatureActive(code);
      return acc;
    },
    {} as Record<string, boolean>
  );
}
