"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Loader2, Save, Eye } from "lucide-react";
import Link from "next/link";
import WysiwygEditor from "@/components/admin/WysiwygEditor";

interface Section {
  type: string;
  [key: string]: unknown;
}

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

const SECTION_TYPES = [
  { type: "HEADER", label: "Header", desc: "Logo + tombol CTA/quick contact (WA) statis" },
  { type: "HERO", label: "Hero", desc: "Judul besar + CTA" },
  { type: "FEATURES", label: "Fitur", desc: "Daftar fitur unggulan" },
  { type: "TESTIMONIAL", label: "Testimoni", desc: "Ulasan siswa/orang tua" },
  { type: "FAQ", label: "FAQ", desc: "Pertanyaan jawaban" },
  { type: "CTA", label: "CTA", desc: "Call to action" },
  { type: "CONTENT", label: "Content", desc: "Konten teks rich (WYSIWYG) — paragraf, heading, list, quote, link" },
  { type: "FORM", label: "Form", desc: "Form inquiry" },
];

function createSection(type: string): Section {
  switch (type) {
    case "HEADER":
      return { type, logoUrl: "", ctaLabel: "Hubungi Kami", ctaUrl: "https://wa.me/6281234567890", model: "RIGHT_LEFT", bgColor: "#ffffff", ctaColor: "#16a34a" };
    case "HERO":
      return { type, title: "", subtitle: "", badge: "", ctaLabel: "Daftar Sekarang", ctaUrl: "/ppdb", bgImage: "" };
    case "FEATURES":
      return { type, title: "Keunggulan Kami", subtitle: "", items: [{ title: "", desc: "" }, { title: "", desc: "" }, { title: "", desc: "" }] };
    case "TESTIMONIAL":
      return { type, title: "Apa Kata Mereka", items: [{ name: "", role: "", text: "", avatar: "" }] };
    case "FAQ":
      return { type, title: "FAQ", items: [{ q: "", a: "" }] };
    case "CTA":
      return { type, title: "Siap memulai?", subtitle: "", ctaLabel: "Daftar Sekarang", ctaUrl: "/ppdb" };
    case "CONTENT":
      return { type, title: "", content: "", bgColor: "#ffffff", textColor: "#1f2937", maxWidth: "3xl" };
    case "FORM":
      return { type, title: "Hubungi Kami", subtitle: "" };
    default:
      return { type };
  }
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

function SectionEditor({ section, onChange }: { section: Section; onChange: (data: Section) => void }) {
  function update(k: string, v: unknown) {
    onChange({ ...section, [k]: v });
  }

  const s = section as Record<string, unknown>;

  if (section.type === "HEADER") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Model Header</label>
            <select value={(s.model as string) ?? "RIGHT_LEFT"} onChange={(e) => update("model", e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
              <option value="RIGHT_LEFT">Right-Left (logo kiri, CTA kanan)</option>
              <option value="TOP_BOTTOM">Top-Bottom (logo atas, CTA bawah — centered)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Logo URL</label>
            <input value={(s.logoUrl as string) ?? ""} onChange={(e) => update("logoUrl", e.target.value)}
              placeholder="https://... (kosong = teks judul halaman)" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Label CTA / Quick Contact</label>
            <input value={(s.ctaLabel as string) ?? ""} onChange={(e) => update("ctaLabel", e.target.value)}
              placeholder="Hubungi Kami" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">URL CTA (WhatsApp)</label>
            <input value={(s.ctaUrl as string) ?? ""} onChange={(e) => update("ctaUrl", e.target.value)}
              placeholder="https://wa.me/6281234567890" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Warna Background</label>
            <input type="color" value={(s.bgColor as string) ?? "#ffffff"} onChange={(e) => update("bgColor", e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-gray-300 p-0.5" aria-label="Warna background header" />
            <span className="font-mono text-xs text-gray-500">{(s.bgColor as string) ?? "#ffffff"}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Warna Tombol CTA</label>
            <input type="color" value={(s.ctaColor as string) ?? "#16a34a"} onChange={(e) => update("ctaColor", e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-gray-300 p-0.5" aria-label="Warna tombol CTA" />
            <span className="font-mono text-xs text-gray-500">{(s.ctaColor as string) ?? "#16a34a"}</span>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === "HERO") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <input value={(s.badge as string) ?? ""} onChange={(e) => update("badge", e.target.value)} placeholder="Badge (opsional)" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.bgImage as string) ?? ""} onChange={(e) => update("bgImage", e.target.value)} placeholder="BG image URL (opsional)" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul hero" className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.subtitle as string) ?? ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Subtitle" className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.ctaLabel as string) ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} placeholder="CTA label" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.ctaUrl as string) ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} placeholder="CTA URL" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
      </div>
    );
  }

  if (section.type === "FEATURES") {
    const items = (s.items as Array<{ title: string; desc: string }>) ?? [];
    return (
      <div className="space-y-2">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul section" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.subtitle as string) ?? ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Subtitle" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item.title} onChange={(e) => { const n = [...items]; n[i] = { ...item, title: e.target.value }; update("items", n); }} placeholder="Fitur" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <input value={item.desc} onChange={(e) => { const n = [...items]; n[i] = { ...item, desc: e.target.value }; update("items", n); }} placeholder="Deskripsi" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <button type="button" onClick={() => update("items", items.filter((_, idx) => idx !== i))} className="rounded p-1 text-gray-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => update("items", [...items, { title: "", desc: "" }])} className="text-xs text-indigo-600 hover:underline">+ Tambah fitur</button>
      </div>
    );
  }

  if (section.type === "TESTIMONIAL") {
    const items = (s.items as Array<{ name: string; role: string; text: string; avatar: string }>) ?? [];
    return (
      <div className="space-y-2">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul section" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        {items.map((item, i) => (
          <div key={i} className="space-y-1 rounded border border-gray-100 p-2">
            <div className="flex gap-2">
              <input value={item.name} onChange={(e) => { const n = [...items]; n[i] = { ...item, name: e.target.value }; update("items", n); }} placeholder="Nama" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
              <input value={item.role} onChange={(e) => { const n = [...items]; n[i] = { ...item, role: e.target.value }; update("items", n); }} placeholder="Peran" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => update("items", items.filter((_, idx) => idx !== i))} className="rounded p-1 text-gray-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <textarea value={item.text} onChange={(e) => { const n = [...items]; n[i] = { ...item, text: e.target.value }; update("items", n); }} placeholder="Testimoni" rows={2} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
        ))}
        <button type="button" onClick={() => update("items", [...items, { name: "", role: "", text: "", avatar: "" }])} className="text-xs text-indigo-600 hover:underline">+ Tambah testimoni</button>
      </div>
    );
  }

  if (section.type === "FAQ") {
    const items = (s.items as Array<{ q: string; a: string }>) ?? [];
    return (
      <div className="space-y-2">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul section" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input value={item.q} onChange={(e) => { const n = [...items]; n[i] = { ...item, q: e.target.value }; update("items", n); }} placeholder="Pertanyaan" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <input value={item.a} onChange={(e) => { const n = [...items]; n[i] = { ...item, a: e.target.value }; update("items", n); }} placeholder="Jawaban" className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm" />
            <button type="button" onClick={() => update("items", items.filter((_, idx) => idx !== i))} className="rounded p-1 text-gray-500 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => update("items", [...items, { q: "", a: "" }])} className="text-xs text-indigo-600 hover:underline">+ Tambah FAQ</button>
      </div>
    );
  }

  if (section.type === "CTA") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul CTA" className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.subtitle as string) ?? ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Subtitle" className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.ctaLabel as string) ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} placeholder="CTA label" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.ctaUrl as string) ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} placeholder="CTA URL" className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
      </div>
    );
  }

  if (section.type === "CONTENT") {
    const maxW = (s.maxWidth as string) ?? "3xl";
    return (
      <div className="space-y-3">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul section (opsional)" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Konten (WYSIWYG)</label>
          <WysiwygEditor
            value={(s.content as string) ?? ""}
            onChange={(html) => update("content", html)}
            placeholder="Tulis paragraf, heading, list, quote, atau link di sini..."
            minHeight={250}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Lebar Konten</label>
            <select value={maxW} onChange={(e) => update("maxWidth", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
              <option value="2xl">Sempit (max-w-2xl)</option>
              <option value="3xl">Sedang (max-w-3xl)</option>
              <option value="4xl">Lebar (max-w-4xl)</option>
              <option value="5xl">Terlebar (max-w-5xl)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">BG</label>
            <input type="color" value={(s.bgColor as string) ?? "#ffffff"} onChange={(e) => update("bgColor", e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-gray-300 p-0.5" aria-label="Warna background" />
            <span className="font-mono text-xs text-gray-500">{(s.bgColor as string) ?? "#ffffff"}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Teks</label>
            <input type="color" value={(s.textColor as string) ?? "#1f2937"} onChange={(e) => update("textColor", e.target.value)} className="h-8 w-12 cursor-pointer rounded border border-gray-300 p-0.5" aria-label="Warna teks" />
            <span className="font-mono text-xs text-gray-500">{(s.textColor as string) ?? "#1f2937"}</span>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === "FORM") {
    return (
      <div className="space-y-2">
        <input value={(s.title as string) ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Judul form" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
        <input value={(s.subtitle as string) ?? ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Subtitle" className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
      </div>
    );
  }

  return null;
}
