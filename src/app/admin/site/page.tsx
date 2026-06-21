import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SITE_DEFAULTS } from "@/lib/site-config";
import SiteCmsClient from "@/components/admin/SiteCmsClient";

export const metadata = { title: "CMS Landing Page" };

export default async function AdminSitePage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const [configRows, banners, gallery, inquiries] = await Promise.all([
    db.siteConfig.findMany(),
    db.siteBanner.findMany({ orderBy: { order: "asc" } }),
    db.siteGallery.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
    db.siteInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const config: Record<string, string> = { ...SITE_DEFAULTS };
  for (const r of configRows) config[r.key] = r.value;

  return (
    <SiteCmsClient
      initialConfig={config}
      initialBanners={banners.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))}
      initialGallery={gallery.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      }))}
      initialInquiries={inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))}
    />
  );
}
