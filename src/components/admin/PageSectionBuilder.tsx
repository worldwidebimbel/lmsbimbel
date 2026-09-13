"use client";

import { Trash2 } from "lucide-react";
import WysiwygEditor from "@/components/admin/WysiwygEditor";

// ============================================================
// Shared section builder — dipakai bersama oleh:
// - LandingPageBuilder (/admin/landing-pages) — semua section types
// - CustomPageBuilder (/admin/custom-pages) — tanpa HEADER
// ============================================================

export interface Section {
  type: string;
  [key: string]: unknown;
}

export const SECTION_TYPES = [
  { type: "HEADER", label: "Header", desc: "Logo + tombol CTA/quick contact (WA) statis" },
  { type: "HERO", label: "Hero", desc: "Judul besar + CTA" },
  { type: "FEATURES", label: "Fitur", desc: "Daftar fitur unggulan" },
  { type: "TESTIMONIAL", label: "Testimoni", desc: "Ulasan siswa/orang tua" },
  { type: "FAQ", label: "FAQ", desc: "Pertanyaan jawaban" },
  { type: "CTA", label: "CTA", desc: "Call to action" },
  { type: "CONTENT", label: "Content", desc: "Konten teks rich (WYSIWYG) — paragraf, heading, list, quote, link" },
  { type: "FORM", label: "Form", desc: "Form inquiry" },
];

export const SECTION_TYPES_NO_HEADER = SECTION_TYPES.filter((s) => s.type !== "HEADER");

export function createSection(type: string): Section {
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

export function SectionEditor({ section, onChange }: { section: Section; onChange: (data: Section) => void }) {
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
