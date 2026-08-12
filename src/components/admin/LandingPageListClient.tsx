"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export default function LandingPageListClient({ pages: initial }: { pages: PageItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pages, setPages] = useState(initial);

  async function togglePublish(id: string, current: boolean) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (res.ok) {
        setPages((p) => p.map((pg) => pg.id === id ? { ...pg, isPublished: !current } : pg));
        router.refresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus landing page ini?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/landing-pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPages((p) => p.filter((pg) => pg.id !== id));
        router.refresh();
      }
    });
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Belum ada landing page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <div key={page.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/admin/landing-pages/${page.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                  {page.title}
                </Link>
                {page.isPublished && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Published</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>/lp/{page.slug}</span>
                <span>{page.viewCount} views</span>
                {page.isPublished && page.publishedAt && (
                  <span>Dipublikasi {new Date(page.publishedAt).toLocaleDateString("id-ID")}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {page.isPublished && (
                <Link
                  href={`/lp/${page.slug}`}
                  target="_blank"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  title="Lihat publik"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={() => togglePublish(page.id, page.isPublished)}
                disabled={isPending}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title={page.isPublished ? "Sembunyikan" : "Publikasikan"}
              >
                {page.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleDelete(page.id)}
                disabled={isPending}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Hapus"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
