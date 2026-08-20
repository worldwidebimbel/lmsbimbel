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
  popupEnabled: "false",
  popupTitle: "",
  popupMessage: "",
  popupLinkUrl: "",
  popupLinkLabel: "Daftar Sekarang",
  logoUrl: "",
  faviconUrl: "",
  header_email: "info@edubimbel.id",
  header_call_center: "0812-3456-7890",
  header_whatsapp_label: "Chat WhatsApp",
  topbar_links: "REGISTER,APPLY ONLINE,BLOG,FAQS",
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
