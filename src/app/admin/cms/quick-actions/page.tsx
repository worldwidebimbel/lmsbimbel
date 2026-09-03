"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  theme: string;
  linkUrl: string | null;
  fileUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function AdminCmsQuickActionsPage() {
  const [items, setItems] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuickAction | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/quick-actions");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<QuickAction> & { title: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/quick-actions/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } else {
      await fetch("/api/admin/cms/quick-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus quick action ini?")) return;
    await fetch(`/api/admin/cms/quick-actions/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quick Actions Homepage</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tambah Quick Action
        </button>
      </div>

      {showForm && (
        <QuickActionForm
          item={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-lg border p-4 ${item.theme === "yellow" ? "border-yellow-200 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                {item.linkUrl && <p className="mt-2 text-xs text-blue-600">{item.linkUrl}</p>}
                {item.fileUrl && <p className="mt-1 text-xs text-green-600">📄 {item.fileUrl}</p>}
                {!item.isActive && <span className="mt-2 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Nonaktif</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(item); setShowForm(true); }} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-500 hover:bg-white">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-red-500 hover:bg-white">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Belum ada quick action.
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionForm({
  item,
  onSave,
  onCancel,
}: {
  item: QuickAction | null;
  onSave: (data: Partial<QuickAction> & { title: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "");
  const [theme, setTheme] = useState(item?.theme ?? "blue");
  const [linkUrl, setLinkUrl] = useState(item?.linkUrl ?? "");
  const [fileUrl, setFileUrl] = useState(item?.fileUrl ?? "");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Quick Action" : "Tambah Quick Action"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Judul *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="KONSULTASI GRATIS" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Icon (Lucide name)</label>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Phone" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tema</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="blue">Biru</option>
            <option value="yellow">Kuning</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Link URL</label>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="/kontak" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">File URL (PDF prospek)</label>
          <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Aktif
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSave({ title, description: description || null, icon: icon || null, theme, linkUrl: linkUrl || null, fileUrl: fileUrl || null, order, isActive })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Simpan
        </button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Batal
        </button>
      </div>
    </div>
  );
}
