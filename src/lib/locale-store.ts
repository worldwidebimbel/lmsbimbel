"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Currency = "IDR" | "USD";
type Locale = "id" | "en";

interface LocaleState {
  currency: Currency;
  locale: Locale;
  setCurrency: (c: Currency) => void;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      currency: "IDR",
      locale: "id",
      setCurrency: (currency) => set({ currency }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: "locale-preference" }
  )
);

export function formatCurrencyDynamic(amount: number, currency: Currency = "IDR"): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount / 15500);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
