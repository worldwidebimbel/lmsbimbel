import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicShell from "@/components/landing/PublicShell";
import LandingPageView from "@/components/site/LandingPageView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.customPage.findUnique({ where: { slug, isPublished: true } });
  if (!page) return { title: "Halaman tidak ditemukan" };

  const title = page.metaTitle || page.title;
  const description = page.metaDesc || "";

  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function CustomPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.customPage.findUnique({ where: { slug, isPublished: true } });
  if (!page) notFound();

  const pageData = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.metaDesc,
    sections: page.sections as { type: string; [key: string]: unknown }[],
    ctaType: "NONE",
    ctaUrl: null,
  };

  const content = (
    <>
      {page.showTitle && (
        <div className="mx-auto max-w-3xl px-4 pt-12">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{page.title}</h1>
        </div>
      )}
      <LandingPageView page={pageData} showFooter={true} />
    </>
  );

  // showFooter={true} di LandingPageView = skip footer bawaannya
  // (footer website dirender PublicShell bila aktif)
  if (page.showHeader || page.showFooter) {
    return (
      <PublicShell>
        {content}
      </PublicShell>
    );
  }

  return <div className="min-h-screen">{content}</div>;
}
