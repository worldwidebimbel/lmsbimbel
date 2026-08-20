"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  text: string;
  avatarUrl: string | null;
  photoUrl: string | null;
  rating: number;
  programName: string | null;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
}

export default function AdminCmsTestimonialPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/testimonials");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<Testimonial> & { name: string; text: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/testimonials/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus testimoni ini?")) return;
    await fetch(`/api/admin/cms/testimonials/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Testimoni</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah Testimoni
        </button>
      </div>

      {showForm && <TestimonialForm item={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
            {(t.photoUrl || t.avatarUrl) && (
              <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <img src={t.photoUrl ?? t.avatarUrl ?? ""} alt={t.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600 line-clamp-3">&ldquo;{t.text}&rdquo;</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role ?? t.programName}</p>
              </div>
              <div className="flex items-center gap-1">
                {t.isFeatured && <span className="flex items-center gap-1 rounded bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700"><Star className="h-3 w-3" /> Featured</span>}
                <button onClick={() => { setEditing(t); setShowForm(true); }} className="rounded p-1 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">Belum ada testimoni.</div>}
      </div>
    </div>
  );
}

function TestimonialForm({ item, onSave, onCancel }: { item: Testimonial | null; onSave: (d: Partial<Testimonial> & { name: string; text: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [role, setRole] = useState(item?.role ?? "");
  const [text, setText] = useState(item?.text ?? "");
  const [photoUrl, setPhotoUrl] = useState(item?.photoUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(item?.avatarUrl ?? "");
  const [rating, setRating] = useState(item?.rating ?? 5);
  const [programName, setProgramName] = useState(item?.programName ?? "");
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Testimoni" : "Tambah Testimoni"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Nama *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Peran</label><input value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Orang Tua / Siswa" /></div>
        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-700">Testimoni *</label><textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Foto Potret URL (4:3)</label><input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Avatar URL (fallback)</label><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Rating</label><select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} bintang</option>)}</select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Program</label><input value={programName} onChange={(e) => setProgramName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Program SMA" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> <Star className="h-4 w-4 text-yellow-400" /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave({ name, text, role: role || null, photoUrl: photoUrl || null, avatarUrl: avatarUrl || null, rating, programName: programName || null, isFeatured, order, isActive })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}
