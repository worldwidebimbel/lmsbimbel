import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicShell from "@/components/landing/PublicShell";
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

  // Increment view tidak ada di model (tidak punya viewCount), skip

  const content = (
    <article className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 md:text-4xl">{page.title}</h1>
        <div
          className="prose prose-sm sm:prose-base max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_table]:w-full [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </article>
  );

  if (page.showHeader || page.showFooter) {
    return (
      <PublicShell>
        {content}
      </PublicShell>
    );
  }

  return <div className="min-h-screen">{content}</div>;
}
