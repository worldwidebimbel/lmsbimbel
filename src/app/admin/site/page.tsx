import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SITE_DEFAULTS } from "@/lib/site-config";
import SiteCmsClient from "@/components/admin/SiteCmsClient";

export const metadata = { title: "CMS Landing Page" };

export default async function AdminSitePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const [configRows, banners, gallery, inquiries, programs, testimonials, blogPosts] = await Promise.all([
    db.siteConfig.findMany(),
    db.siteBanner.findMany({ orderBy: { order: "asc" } }),
    db.siteGallery.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
    db.siteInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.siteProgram.findMany({ orderBy: { order: "asc" } }),
    db.siteTestimonial.findMany({ orderBy: { order: "asc" } }),
    db.blogPost.findMany({ orderBy: { createdAt: "desc" } }),
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
      initialPrograms={programs.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
      initialTestimonials={testimonials.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))}
      initialBlogPosts={blogPosts.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        publishedAt: b.publishedAt?.toISOString() ?? null,
      }))}
    />
  );
}
