// ============================================================
// AI Builder — Fase 2b: Aset Visual CMS (kapabilitas DESIGN)
// Preset use case untuk generate aset visual promosi website.
// Dipakai bersama oleh route /api/ai/design dan UI DesignGeneratorTab.
// Lihat doc/future-commit.md §4.6 & §5.1.
// ============================================================

export type DesignPresetId =
  | "hero_banner"
  | "cover_program"
  | "popup_promo"
  | "section_lpcp"
  | "cover_blog"
  | "galeri";

export interface DesignPreset {
  id: DesignPresetId;
  label: string;
  description: string;
  /** Ukuran target (untuk panduan prompt & label UI). */
  size: string;
  /** Rasio aspek yang dipakai provider image. */
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
  /** Hint gaya otomatis yang ditambahkan ke prompt. */
  styleHint: string;
  /** Entitas CMS tujuan "Pasang ke..." — menentukan mode install. */
  installTarget:
    | "SiteBanner" // buat banner baru (POST /api/admin/site/banners)
    | "SiteProgram" // update imageUrl program tertentu
    | "SitePopup" // update popupBgImage di SiteConfig
    | "BlogPost" // update coverImage artikel tertentu
    | "SiteGallery" // buat item galeri baru
    | "MediaOnly"; // hanya simpan ke Media Manager (untuk Section Builder dll.)
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "hero_banner",
    label: "Hero / Slider Banner",
    description: "Banner utama homepage & slider — ukuran lebar, dramatis.",
    size: "1920×800",
    aspectRatio: "16:9",
    styleHint: "wide cinematic hero banner, high quality, professional marketing visual, space for text overlay on one side",
    installTarget: "SiteBanner",
  },
  {
    id: "cover_program",
    label: "Cover Program",
    description: "Gambar cover untuk kartu program bimbel.",
    size: "1200×900",
    aspectRatio: "4:3",
    styleHint: "program cover image, clean educational marketing visual, vibrant, suitable for card display",
    installTarget: "SiteProgram",
  },
  {
    id: "popup_promo",
    label: "Popup Promo",
    description: "Gambar background popup promosi di homepage.",
    size: "800×800",
    aspectRatio: "1:1",
    styleHint: "promotional popup background, eye-catching, marketing visual, space for overlay text",
    installTarget: "SitePopup",
  },
  {
    id: "section_lpcp",
    label: "Gambar Section LP/CP",
    description: "Gambar untuk section Landing Page / Custom Page (HERO bgImage, CONTENT, dll.).",
    size: "1600×900",
    aspectRatio: "16:9",
    styleHint: "section background image, clean, professional, suitable for landing page section",
    installTarget: "MediaOnly",
  },
  {
    id: "cover_blog",
    label: "Cover Blog",
    description: "Cover image artikel blog (rasio OG 1200×630).",
    size: "1200×630",
    aspectRatio: "16:9",
    styleHint: "blog cover image, editorial, engaging, suitable for article thumbnail",
    installTarget: "BlogPost",
  },
  {
    id: "galeri",
    label: "Galeri",
    description: "Foto galeri aktivitas / fasilitas bimbel.",
    size: "1200×1200",
    aspectRatio: "1:1",
    styleHint: "gallery photo, vibrant, candid educational activity or facility, high quality",
    installTarget: "SiteGallery",
  },
];

export function getDesignPreset(id: string): DesignPreset | undefined {
  return DESIGN_PRESETS.find((p) => p.id === id);
}
