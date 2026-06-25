import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import PublicShell from "@/components/landing/PublicShell";

export const metadata: Metadata = {
  title: "Blog - EduBimbel",
  description: "Artikel, tips, dan informasi terbaru seputar pendidikan dan bimbingan belajar.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <PublicShell>
      <div className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Blog & Artikel</h1>
            <p className="mt-3 text-gray-500">Tips, trik, dan informasi terbaru seputar pendidikan.</p>
          </div>

          {posts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Belum ada artikel yang dipublikasikan.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post.id} className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {post.coverImage && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium text-blue-600">{post.category}</span>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3">{post.excerpt ?? post.content.slice(0, 120).replace(/<[^>]+>/g, "")}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-400">
                      <span>{post.author || "EduBimbel"}</span>
                      <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID") : "-"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
