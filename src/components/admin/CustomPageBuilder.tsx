"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Eye } from "lucide-react";
import WysiwygEditor from "@/components/admin/WysiwygEditor";

interface PageData {
  id?: string;
  slug: string;
  title: string;
  content: string;
  showHeader: boolean;
  showFooter: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  isPublished: boolean;
}

export default function CustomPageBuilder({
  mode,
  pageId,
  initialData,
}: {
  mode: "create" | "edit";
  pageId?: string;
  initialData?: PageData;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<PageData>(
    initialData ?? {
      slug: "", title: "", content: "",
      showHeader: true, showFooter: true,
      metaTitle: "", metaDesc: "", isPublished: false,
    }
  );

  function updateField(k: keyof PageData, v: unknown) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleSave(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload = { ...form, isPublished: publish };
      const url = mode === "create" ? "/api/admin/custom-pages" : `/api/admin/custom-pages/${pageId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal menyimpan");
        return;
      }
      router.push("/admin/custom-pages");
      router.refresh();
    });
  }

  return (
    <form className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* Informasi Dasar */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Slug (URL) *</label>
            <input required value={form.slug} onChange={(e) => updateField("slug", e.target.value)}
              placeholder="syarat-ketentuan" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-gray-500">URL: /p/{form.slug || "..."}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Judul *</label>
            <input required value={form.title} onChange={(e) => updateField("title", e.target.value)}
              placeholder="Syarat & Ketentuan" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 rounded-lg bg-gray-50 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showHeader} onChange={(e) => updateField("showHeader", e.target.checked)} className="rounded" />
            <span className="font-medium text-gray-700">Tampilkan Header Website</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showFooter} onChange={(e) => updateField("showFooter", e.target.checked)} className="rounded" />
            <span className="font-medium text-gray-700">Tampilkan Footer Website</span>
          </label>
        </div>
      </div>

      {/* Konten */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Konten Halaman</h3>
        <WysiwygEditor
          value={form.content}
          onChange={(v: string) => updateField("content", v)}
          placeholder="Tulis konten halaman di sini..."
        />
      </div>

      {/* SEO */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">SEO (opsional)</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Meta Title</label>
          <input value={form.metaTitle ?? ""} onChange={(e) => updateField("metaTitle", e.target.value)}
            placeholder="Meta title untuk SEO" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Meta Description</label>
          <textarea value={form.metaDesc ?? ""} onChange={(e) => updateField("metaDesc", e.target.value)}
            rows={2} placeholder="Deskripsi untuk SEO (max 160 karakter)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/admin/custom-pages" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Batal
        </Link>
        <button type="button" onClick={(e) => handleSave(e as unknown as React.FormEvent, false)} disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Draft
        </button>
        <button type="button" onClick={(e) => handleSave(e as unknown as React.FormEvent, true)} disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Simpan & Publikasi
        </button>
      </div>
    </form>
  );
}
