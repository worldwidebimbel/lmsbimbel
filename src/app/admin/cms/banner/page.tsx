"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Star } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  titleHighlight: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  alignment: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
}

export default function AdminCmsBannerPage() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Banner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/banners");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<Banner> & { title: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/banners/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus banner ini?")) return;
    await fetch(`/api/admin/cms/banners/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hero Banner</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah Banner
        </button>
      </div>

      {showForm && <BannerForm item={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <div className="space-y-4">
        {items.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* Hero preview */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700">
              {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-black" style={{ opacity: b.overlayOpacity }} />
              <div className={`relative z-10 flex h-full flex-col justify-center px-6 text-white ${b.alignment === "center" ? "items-center text-center" : b.alignment === "right" ? "items-end text-right" : "items-start"}`}>
                <h3 className="text-lg font-bold">{b.title} {b.titleHighlight && <span className="text-yellow-400">{b.titleHighlight}</span>}</h3>
                {b.subtitle && <p className="text-xs text-white/80">{b.subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{b.title}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{b.alignment}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">opacity: {b.overlayOpacity}</span>
                {!b.isActive && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Nonaktif</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(b); setShowForm(true); }} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(b.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">Belum ada banner.</div>}
      </div>
    </div>
  );
}

function BannerForm({ item, onSave, onCancel }: { item: Banner | null; onSave: (d: Partial<Banner> & { title: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [titleHighlight, setTitleHighlight] = useState(item?.titleHighlight ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(item?.linkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(item?.linkLabel ?? "");
  const [alignment, setAlignment] = useState(item?.alignment ?? "left");
  const [overlayOpacity, setOverlayOpacity] = useState(item?.overlayOpacity ?? 0.4);
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Banner" : "Tambah Banner"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Judul *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Wujudkan Mimpi" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Highlight (kuning)</label><input value={titleHighlight} onChange={(e) => setTitleHighlight(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Cemerlang" /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Subteks</label><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://res.cloudinary.com/..." /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Link URL</label><input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Link Label</label><input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Selengkapnya" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Alignment</label><select value={alignment} onChange={(e) => setAlignment(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="left">Kiri</option><option value="center">Tengah</option><option value="right">Kanan</option></select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Overlay Opacity ({overlayOpacity})</label><input type="range" min="0" max="1" step="0.1" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave({ title, titleHighlight: titleHighlight || null, subtitle: subtitle || null, imageUrl: imageUrl || null, linkUrl: linkUrl || null, linkLabel: linkLabel || null, alignment, overlayOpacity, order, isActive })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}
