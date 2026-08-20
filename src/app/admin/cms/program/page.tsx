"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";

interface Program {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  color: string;
  imageUrl: string | null;
  features: unknown;
  levelLabel: string | null;
  theme: string;
  imagePosition: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function AdminCmsProgramPage() {
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Program | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/programs");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<Program> & { title: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/programs/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus program ini?")) return;
    await fetch(`/api/admin/cms/programs/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Program Unggulan</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah Program
        </button>
      </div>

      {showForm && <ProgramForm item={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => {
          const features = Array.isArray(p.features) ? (p.features as { title?: string }[]) : [];
          return (
            <div key={p.id} className={`overflow-hidden rounded-lg border ${p.theme === "yellow" ? "border-yellow-200" : "border-blue-200"} bg-white`}>
              {p.imageUrl && <div className="aspect-video bg-gray-100"><img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" /></div>}
              <div className="p-4">
                {p.levelLabel && <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${p.theme === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{p.levelLabel}</span>}
                <h3 className="mt-2 font-bold text-gray-900">{p.title}</h3>
                {p.subtitle && <p className="text-sm text-gray-500">{p.subtitle}</p>}
                {features.length > 0 && <p className="mt-1 text-xs text-gray-400">{features.length} fitur</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.isActive ? "Aktif" : "Nonaktif"}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded p-1 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">Belum ada program.</div>}
      </div>
    </div>
  );
}

function ProgramForm({ item, onSave, onCancel }: { item: Program | null; onSave: (d: Partial<Program> & { title: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "GraduationCap");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [levelLabel, setLevelLabel] = useState(item?.levelLabel ?? "");
  const [theme, setTheme] = useState(item?.theme ?? "blue");
  const [imagePosition, setImagePosition] = useState(item?.imagePosition ?? "left");
  const [linkUrl, setLinkUrl] = useState(item?.linkUrl ?? "");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [features, setFeatures] = useState<string[]>(
    Array.isArray(item?.features) ? (item!.features as { title?: string }[]).map((f) => f.title ?? "") : [""]
  );

  function updateFeature(idx: number, val: string) {
    setFeatures((prev) => prev.map((f, i) => (i === idx ? val : f)));
  }
  function addFeature() { setFeatures((prev) => [...prev, ""]); }
  function removeFeature(idx: number) { setFeatures((prev) => prev.filter((_, i) => i !== idx)); }

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Program" : "Tambah Program"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Judul *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Subteks</label><input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Icon (Lucide)</label><input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="GraduationCap" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Badge Jenjang</label><input value={levelLabel} onChange={(e) => setLevelLabel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="SMA / SMP" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Tema</label><select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="blue">Biru</option><option value="yellow">Kuning</option></select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Posisi Gambar</label><select value={imagePosition} onChange={(e) => setImagePosition(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="left">Kiri</option><option value="right">Kanan</option></select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Link URL</label><input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>

      {/* Features editor */}
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">Daftar Fitur</label>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-300" />
              <input value={f} onChange={(e) => updateFeature(i, e.target.value)} className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm" placeholder="Fitur unggulan..." />
              <button type="button" onClick={() => removeFeature(i)} className="rounded p-1 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addFeature} className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" /> Tambah Fitur</button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSave({ title, subtitle: subtitle || null, description: description || null, icon, imageUrl: imageUrl || null, features: features.filter((f) => f.trim()).map((f) => ({ title: f })), levelLabel: levelLabel || null, theme, imagePosition, linkUrl: linkUrl || null, order, isActive })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}
