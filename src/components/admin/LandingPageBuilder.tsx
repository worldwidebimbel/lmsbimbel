"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Loader2, Save, Eye } from "lucide-react";
import Link from "next/link";
import {
  SectionEditor,
  SECTION_TYPES,
  createSection,
  type Section,
} from "@/components/admin/PageSectionBuilder";

interface PageData {
  id?: string;
  slug: string;
  title: string;
  description: string | null;
  sections: Section[];
  metaTitle: string | null;
  metaDesc: string | null;
  ogImage: string | null;
  ctaType: string;
  ctaUrl: string | null;
  showHeader: boolean;
  showFooter: boolean;
  isPublished: boolean;
}

export default function LandingPageBuilder({
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
      slug: "", title: "", description: "", sections: [],
      metaTitle: "", metaDesc: "", ogImage: "",
      ctaType: "INQUIRY", ctaUrl: "", showHeader: false, showFooter: false, isPublished: false,
    }
  );

  function updateField(k: keyof PageData, v: unknown) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function addSection(type: string) {
    setForm((p) => ({ ...p, sections: [...p.sections, createSection(type)] }));
  }

  function removeSection(i: number) {
    setForm((p) => ({ ...p, sections: p.sections.filter((_, idx) => idx !== i) }));
  }

  function updateSection(i: number, data: Section) {
    setForm((p) => {
      const sections = [...p.sections];
      sections[i] = data;
      return { ...p, sections };
    });
  }

  function moveSection(i: number, dir: -1 | 1) {
    setForm((p) => {
      const sections = [...p.sections];
      const j = i + dir;
      if (j < 0 || j >= sections.length) return p;
      [sections[i], sections[j]] = [sections[j], sections[i]];
      return { ...p, sections };
    });
  }

  function handleSave(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload = { ...form, isPublished: publish };
      const url = mode === "create" ? "/api/admin/landing-pages" : `/api/admin/landing-pages/${pageId}`;
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
      router.push("/admin/landing-pages");
      router.refresh();
    });
  }

  return (
    <form className="space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Slug (URL) *</label>
            <input required value={form.slug} onChange={(e) => updateField("slug", e.target.value)}
              placeholder="promo-ppdb-2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <p className="mt-1 text-xs text-gray-500">URL: /lp/{form.slug || "..."}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Judul *</label>
            <input required value={form.title} onChange={(e) => updateField("title", e.target.value)}
              placeholder="Promo PPDB 2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Deskripsi</label>
          <textarea value={form.description ?? ""} onChange={(e) => updateField("description", e.target.value)}
            rows={2} placeholder="Deskripsi singkat halaman..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-6 rounded-lg bg-gray-50 p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showHeader} onChange={(e) => updateField("showHeader", e.target.checked)} className="rounded" />
            <span className="font-medium text-gray-700">Tampilkan Header Website</span>
            <span className="text-xs text-gray-500">(header & menu navigasi website)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showFooter} onChange={(e) => updateField("showFooter", e.target.checked)} className="rounded" />
            <span className="font-medium text-gray-700">Tampilkan Footer Website</span>
            <span className="text-xs text-gray-500">(footer website)</span>
          </label>
        </div>
        {(form.showHeader || form.showFooter) && (
          <p className="text-xs text-indigo-600">
            Halaman akan ditampilkan dengan header/footer website. Section "HEADER" di builder akan diabaikan saat showHeader aktif.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">SEO</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Meta Title</label>
            <input value={form.metaTitle ?? ""} onChange={(e) => updateField("metaTitle", e.target.value)}
              placeholder="Meta title untuk SEO" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">OG Image URL</label>
            <input value={form.ogImage ?? ""} onChange={(e) => updateField("ogImage", e.target.value)}
              placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Meta Description</label>
          <textarea value={form.metaDesc ?? ""} onChange={(e) => updateField("metaDesc", e.target.value)}
            rows={2} placeholder="Deskripsi untuk SEO (max 160 karakter)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Section Builder</h3>
          <span className="text-xs text-gray-500">{form.sections.length} section</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTION_TYPES.map((st) => (
            <button key={st.type} type="button" onClick={() => addSection(st.type)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600">
              <Plus className="h-3 w-3" /> {st.label}
            </button>
          ))}
        </div>

        {form.sections.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">Belum ada section. Klik tombol di atas untuk menambah.</p>
        ) : (
          <div className="space-y-3">
            {form.sections.map((section, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300" />
                    <span className="text-sm font-medium text-gray-700">{section.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">↑</button>
                    <button type="button" onClick={() => moveSection(i, 1)} disabled={i === form.sections.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs">↓</button>
                    <button type="button" onClick={() => removeSection(i)}
                      className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <SectionEditor section={section} onChange={(data) => updateSection(i, data)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/admin/landing-pages" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Batal
        </Link>
        <button type="button" onClick={(e) => handleSave(e as unknown as React.FormEvent, false)} disabled={isPending}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Draft
        </button>
        <button type="button" onClick={(e) => handleSave(e as unknown as React.FormEvent, true)} disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Simpan & Publikasi
        </button>
      </div>
    </form>
  );
}

