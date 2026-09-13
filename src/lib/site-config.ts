import { db } from "@/lib/db";

export const SITE_DEFAULTS = {
  siteName: "EduBimbel",
  tagline: "Wujudkan Mimpi Cemerlang Bersama Kami",
  description:
    "Program bimbingan belajar berkualitas dengan guru profesional, kurikulum terstruktur, dan teknologi pembelajaran modern untuk kesuksesan akademik Anda.",
  phone: "0812-3456-7890",
  whatsapp: "6281234567890",
  email: "info@edubimbel.id",
  address: "Jl. Pendidikan No. 123, Jakarta",
  colorPrimary: "#2563EB",
  colorSecondary: "#EAB308",
  colorAccent: "#1E3A5F",
  trialText: "Daftar sekarang dan nikmati sesi trial gratis pertama Anda.",
  ctaHeading: "Siap Meraih Prestasi?",
  ctaPrimaryLabel: "Daftar Sekarang",
  ctaPrimaryLink: "#daftar",
  ctaPrimaryColor: "#FFFFFF",
  ctaSecondaryLabel: "Hubungi Kami",
  ctaSecondaryLink: "",
  popupEnabled: "false",
  popupTitle: "",
  popupMessage: "",
  popupLinkUrl: "",
  popupLinkLabel: "Daftar Sekarang",
  popupMode: "light",
  popupBgColor: "",
  popupBgImage: "",
  logoUrl: "",
  logoDarkUrl: "",
  logoMaxWidth: "180",
  faviconUrl: "",
  header_email: "info@edubimbel.id",
  header_call_center: "0812-3456-7890",
  header_whatsapp_label: "Chat WhatsApp",
  topbar_links: "REGISTER,APPLY ONLINE,BLOG,FAQS",
  hero_type: "slider",
  // ===== Counter/Stats Settings =====
  counter_enabled: "true", // "true" | "false" — tampilkan/sembunyikan section statistik
  counter_display: "real", // "real" (data asli DB) | "fake" (angka manual)
  counter_layout: "1", // "1" (inline minimalis) | "2" (kartu icon) | "3" (kartu gradient sejajar)
  counter_fake_students: "1200",
  counter_fake_teachers: "50",
  counter_fake_classes: "35",
  counter_fake_subjects: "15",
  // ===== Header Settings =====
  header_type: "default", // "default" (Topbar+Mainbar+Bottombar) | "simple" (Mainbar only)
  header_mainbar_mode: "light", // "light" | "dark"
  header_show_topbar: "true",
  header_show_bottombar: "true",
  header_sticky: "true",
  header_width_mode: "full_width", // "full_width" (max-w-7xl) | "full_screen" (w-full px-4)
  header_mainbar_max_height: "80", // px
  header_topbar_bg: "#1e3a5f",
  header_topbar_text: "#ffffff",
  header_bottombar_bg: "#1e40af",
  header_bottombar_text: "#ffffff",
  header_menu_font_size: "14", // px
  header_menu_text: "#ffffff",
  header_menu_hover: "#eab308",
  header_menu_active: "#eab308",
  header_menu_hover_effect: "color", // "color" | "background" | "line"
  header_cta_bg: "#22c55e",
  header_cta_text: "#ffffff",
  header_whatsapp_bg: "#22c55e",
  header_whatsapp_text: "#ffffff",
};

export type SiteConfigKeys = keyof typeof SITE_DEFAULTS;

export async function getSiteConfig(): Promise<typeof SITE_DEFAULTS> {
  try {
    const rows = await db.siteConfig.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return { ...SITE_DEFAULTS, ...map } as typeof SITE_DEFAULTS;
  } catch {
    return { ...SITE_DEFAULTS };
  }
}
