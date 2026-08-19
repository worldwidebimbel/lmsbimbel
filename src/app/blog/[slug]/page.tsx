import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import PublicShell from "@/components/landing/PublicShell";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug, isPublished: true } });
  if (!post) return { title: "Artikel tidak ditemukan" };
  return {
    title: `${post.title} - EduBimbel Blog`,
    description: post.excerpt || post.content.slice(0, 160).replace(/<[^>]+>/g, ""),
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug, isPublished: true } });
  if (!post) notFound();

  return (
    <PublicShell>
      <article className="py-12 px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Blog
          </Link>

          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{post.category}</span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">{post.title}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>{post.author || "EduBimbel"}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </span>
          </div>

          {post.coverImage && (
            <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-gray-100">
              <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            </div>
          )}

          <div className="prose prose-blue mt-8 max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </article>
    </PublicShell>
  );
}
