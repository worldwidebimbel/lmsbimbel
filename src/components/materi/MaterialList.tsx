"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus, Search, FileText, Video, Link2, BookOpen,
  Pencil, Trash2, Eye, EyeOff, Upload, Youtube,
} from "lucide-react";
import { MaterialUploadModal } from "./MaterialUploadModal";
import type { MaterialItem, MaterialClass, MaterialSubject } from "./types";

type Subject = MaterialSubject;
type Class = MaterialClass;
type Material = MaterialItem;

const TYPE_ICON: Record<string, React.ElementType> = {
  PDF: FileText,
  VIDEO: Video,
  YOUTUBE: Youtube,
  PRESENTATION: FileText,
  DOCUMENT: FileText,
  LINK: Link2,
  TEXT: BookOpen,
};

const TYPE_LABEL: Record<string, string> = {
  PDF: "PDF",
  VIDEO: "Video",
  YOUTUBE: "YouTube",
  PRESENTATION: "PPT",
  DOCUMENT: "Dokumen",
  LINK: "Link",
  TEXT: "Teks",
};

const TYPE_COLOR: Record<string, string> = {
  PDF: "bg-red-100 text-red-700",
  VIDEO: "bg-blue-100 text-blue-700",
  YOUTUBE: "bg-red-100 text-red-600",
  PRESENTATION: "bg-orange-100 text-orange-700",
  DOCUMENT: "bg-indigo-100 text-indigo-700",
  LINK: "bg-teal-100 text-teal-700",
  TEXT: "bg-green-100 text-green-700",
};

interface Props {
  initialMaterials: MaterialItem[];
  classes: Class[];
  subjects: Subject[];
  role: "GURU" | "ADMIN" | "SUPER_ADMIN";
}

export function MaterialList({ initialMaterials, classes, subjects, role }: Props) {
  const [materials, setMaterials] = useState<MaterialItem[]>(initialMaterials);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Material | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = materials.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.name.toLowerCase().includes(search.toLowerCase()) || false;
    const matchType = filterType === "ALL" || m.type === filterType;
    return matchSearch && matchType;
  });

  const handleTogglePublish = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await fetch(`/api/materi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !current }),
      });
      if (res.ok) {
        setMaterials((prev) =>
          prev.map((m) => m.id === id ? { ...m, isPublished: !current } : m)
        );
        toast.success(!current ? "Materi dipublikasikan" : "Materi disembunyikan");
      } else {
        toast.error("Gagal mengubah status materi");
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Hapus materi "${title}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/materi/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        toast.success("Materi dihapus");
      } else {
        toast.error("Gagal menghapus materi");
      }
    });
  };

  const handleSaved = (saved: Material) => {
    setMaterials((prev) => {
      const exists = prev.find((m) => m.id === saved.id);
      return exists
        ? prev.map((m) => m.id === saved.id ? saved : m)
        : [saved, ...prev];
    });
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi atau mata pelajaran..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">Semua Tipe</option>
          {Object.entries(TYPE_LABEL).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Upload Materi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Materi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {materials.filter((m) => m.isPublished).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Dipublikasi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">
            {materials.filter((m) => !m.isPublished).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Draft</p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada materi</p>
          <p className="text-sm text-gray-400 mt-1">Klik &quot;Upload Materi&quot; untuk mulai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((material) => {
            const Icon = TYPE_ICON[material.type] ?? FileText;
            return (
              <div key={material.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                {/* Type icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLOR[material.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{material.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${material.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {material.isPublished ? "Publik" : "Draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    {material.subject && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: material.subject.color }} />
                        {material.subject.name}
                      </span>
                    )}
                    {material.class && <span>{material.class.name}</span>}
                    <span className={`px-1.5 py-0.5 rounded ${TYPE_COLOR[material.type]}`}>
                      {TYPE_LABEL[material.type]}
                    </span>
                    <span>{material._count.progress} dilihat</span>
                  </div>
                  {material.description && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{material.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {material.fileUrl && (
                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Link2 className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleTogglePublish(material.id, material.isPublished)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                    title={material.isPublished ? "Sembunyikan" : "Publikasikan"}
                  >
                    {material.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditTarget(material); setShowModal(true); }}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id, material.title)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <MaterialUploadModal
          classes={classes}
          subjects={subjects}
          editData={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
