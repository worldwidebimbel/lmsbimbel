"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export default function AdminCmsSocialLinksPage() {
  const [items, setItems] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/social-links");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<SocialLink> & { platform: string; url: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/social-links/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/social-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus social link ini?")) return;
    await fetch(`/api/admin/cms/social-links/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Social Links</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      {showForm && <SocialForm item={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-700">{s.platform.slice(0, 2)}</span>
              <div>
                <span className="font-semibold text-gray-900">{s.platform}</span>
                <span className="ml-2 text-sm text-gray-500">{s.url}</span>
              </div>
              {!s.isActive && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Nonaktif</span>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(s); setShowForm(true); }} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(s.id)} className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">Belum ada social link.</div>}
      </div>
    </div>
  );
}

function SocialForm({ item, onSave, onCancel }: { item: SocialLink | null; onSave: (d: Partial<SocialLink> & { platform: string; url: string }) => void; onCancel: () => void }) {
  const [platform, setPlatform] = useState(item?.platform ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Social Link" : "Tambah Social Link"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Platform *</label><input value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Facebook" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">URL *</label><input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://facebook.com/..." /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Icon (opsional)</label><input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave({ platform, url, icon: icon || null, order, isActive })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}
