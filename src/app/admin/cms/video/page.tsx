"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Star } from "lucide-react";

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  category: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
}

interface VideoHighlight {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  theme: string;
  order: number;
  isActive: boolean;
}

export default function AdminCmsVideoPage() {
  const [tab, setTab] = useState<"videos" | "highlights">("videos");
  const [videos, setVideos] = useState<Video[]>([]);
  const [highlights, setHighlights] = useState<VideoHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<VideoHighlight | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showHighlightForm, setShowHighlightForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, hRes] = await Promise.all([
      fetch("/api/admin/cms/videos"),
      fetch("/api/admin/cms/video-highlights"),
    ]);
    setVideos(await vRes.json());
    setHighlights(await hRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveVideo(item: Partial<Video> & { title: string; videoUrl: string }) {
    if (editingVideo) {
      await fetch(`/api/admin/cms/videos/${editingVideo.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowVideoForm(false);
    setEditingVideo(null);
    load();
  }

  async function deleteVideo(id: string) {
    if (!confirm("Hapus video ini?")) return;
    await fetch(`/api/admin/cms/videos/${id}`, { method: "DELETE" });
    load();
  }

  async function saveHighlight(item: Partial<VideoHighlight> & { title: string }) {
    if (editingHighlight) {
      await fetch(`/api/admin/cms/video-highlights/${editingHighlight.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    } else {
      await fetch("/api/admin/cms/video-highlights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
    }
    setShowHighlightForm(false);
    setEditingHighlight(null);
    load();
  }

  async function deleteHighlight(id: string) {
    if (!confirm("Hapus highlight ini?")) return;
    await fetch(`/api/admin/cms/video-highlights/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Video Activity CMS</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("videos")}
          className={`px-4 py-2 text-sm font-semibold ${tab === "videos" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
        >
          Video ({videos.length})
        </button>
        <button
          onClick={() => setTab("highlights")}
          className={`px-4 py-2 text-sm font-semibold ${tab === "highlights" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
        >
          Highlights ({highlights.length})
        </button>
      </div>

      {tab === "videos" && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => { setEditingVideo(null); setShowVideoForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Tambah Video
            </button>
          </div>

          {showVideoForm && (
            <VideoForm item={editingVideo} onSave={saveVideo} onCancel={() => { setShowVideoForm(false); setEditingVideo(null); }} />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {v.thumbnailUrl && (
                  <div className="relative aspect-video bg-gray-100">
                    <img src={v.thumbnailUrl} alt={v.title} className="h-full w-full object-cover" />
                    {v.isFeatured && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-yellow-400 px-2 py-0.5 text-xs font-bold text-blue-950">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900">{v.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{v.category} · {v.duration ?? "—"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`rounded px-2 py-0.5 text-xs ${v.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {v.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingVideo(v); setShowVideoForm(true); }} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteVideo(v.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "highlights" && (
        <div>
          <div className="mb-4">
            <button
              onClick={() => { setEditingHighlight(null); setShowHighlightForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Tambah Highlight
            </button>
          </div>

          {showHighlightForm && (
            <HighlightForm item={editingHighlight} onSave={saveHighlight} onCancel={() => { setShowHighlightForm(false); setEditingHighlight(null); }} />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h) => (
              <div key={h.id} className={`rounded-lg border p-4 ${h.theme === "yellow" ? "border-yellow-200 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{h.title}</h3>
                    {h.description && <p className="mt-1 text-sm text-gray-600">{h.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingHighlight(h); setShowHighlightForm(true); }} className="rounded p-1 text-gray-500 hover:bg-white">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteHighlight(h.id)} className="rounded p-1 text-red-500 hover:bg-white">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoForm({ item, onSave, onCancel }: { item: Video | null; onSave: (d: Partial<Video> & { title: string; videoUrl: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(item?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnailUrl ?? "");
  const [duration, setDuration] = useState(item?.duration ?? "");
  const [category, setCategory] = useState(item?.category ?? "Umum");
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false);
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Video" : "Tambah Video"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Judul *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Video URL *</label><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://youtube.com/..." /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Thumbnail URL</label><input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Durasi</label><input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="3:45" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label><input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave({ title, videoUrl, thumbnailUrl: thumbnailUrl || null, duration: duration || null, category, isFeatured, order, isActive })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}

function HighlightForm({ item, onSave, onCancel }: { item: VideoHighlight | null; onSave: (d: Partial<VideoHighlight> & { title: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "");
  const [theme, setTheme] = useState(item?.theme ?? "blue");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Highlight" : "Tambah Highlight"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Judul *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label><input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Icon</label><input value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Zap" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Tema</label><select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="blue">Biru</option><option value="yellow">Kuning</option></select></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label><input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Aktif</label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => onSave({ title, description: description || null, icon: icon || null, theme, order, isActive })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Simpan</button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
      </div>
    </div>
  );
}
