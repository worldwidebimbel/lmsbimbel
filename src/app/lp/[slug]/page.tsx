import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import LandingPageView from "@/components/site/LandingPageView";
import PublicShell from "@/components/landing/PublicShell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.landingPage.findUnique({ where: { slug, isPublished: true } });
  if (!page) return { title: "Halaman tidak ditemukan" };

  const title = page.metaTitle || page.title;
  const description = page.metaDesc || page.description || "";
  const images = page.ogImage ? [{ url: page.ogImage }] : [];

  return {
    title,
    description,
    openGraph: { title, description, images, type: "website" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function LandingPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.landingPage.findUnique({ where: { slug, isPublished: true } });
  if (!page) notFound();

  // Increment view count (fire-and-forget)
  db.landingPage.update({ where: { id: page.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const pageData = JSON.parse(JSON.stringify(page));

  // Wrap dengan PublicShell (header + footer website) saat showHeader=true
  if (page.showHeader || page.showFooter) {
    return (
      <PublicShell>
        <LandingPageView page={pageData} showHeader={page.showHeader} showFooter={page.showFooter} />
      </PublicShell>
    );
  }

  return <LandingPageView page={pageData} />;
}
