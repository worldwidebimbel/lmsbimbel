"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { FeatureFlag } from "@/types";

interface FeatureFlagContextType {
  flags: FeatureFlag[];
  isLoading: boolean;
  isFeatureActive: (code: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: [],
  isLoading: true,
  isFeatureActive: () => false,
  refreshFlags: async () => {},
});

export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/features", { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      }
    } catch (error) {
      console.error("Failed to fetch feature flags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureActive = useCallback(
    (code: string): boolean => {
      const flag = flags.find((f) => f.code === code);
      return flag?.isActive ?? false;
    },
    [flags]
  );

  const refreshFlags = useCallback(async () => {
    setIsLoading(true);
    await fetchFlags();
  }, [fetchFlags]);

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, isFeatureActive, refreshFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
