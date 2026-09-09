"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2, Pencil, ExternalLink, FileText } from "lucide-react";

interface CustomPageItem {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function CustomPageListClient({ pages }: { pages: CustomPageItem[] }) {
  const [items, setItems] = useState<CustomPageItem[]>(pages);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus halaman "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    await fetch(`/api/admin/custom-pages/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">Belum ada custom page.</p>
        <p className="text-xs text-gray-400">Klik "Buat Custom Page" di atas untuk membuat halaman seperti Terms, Privacy Policy, Karir, dst.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((page) => (
        <div key={page.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{page.title}</span>
              {page.isPublished ? (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Published</span>
              ) : (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Draft</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
              <span>/p/{page.slug}</span>
              {page.isPublished && (
                <Link href={`/p/${page.slug}`} target="_blank" className="flex items-center gap-0.5 text-blue-600 hover:underline">
                  Lihat <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/custom-pages/${page.id}`}
              className="rounded p-2 text-gray-500 hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(page.id, page.title)}
              className="rounded p-2 text-red-500 hover:bg-red-50"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
