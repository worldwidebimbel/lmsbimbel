import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lmsbimbel.digsan.id";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tentang", "/faq", "/galeri", "/cabang", "/ppdb", "/blog", "/program/", "/lp/", "/sitemap.xml"],
        disallow: ["/admin/", "/api/", "/guru/", "/siswa/", "/orangtua/", "/login", "/register", "/profile"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
