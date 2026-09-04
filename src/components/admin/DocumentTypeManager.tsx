"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, FileText, X,
} from "lucide-react";

export type DocType = {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  maxSizeMb: number;
  allowedTypes: string[];
  isActive: boolean;
  order: number;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  isRequired: true,
  maxSizeMb: "2",
  allowedTypes: "pdf,jpg,jpeg,png",
  order: "0",
};

export function DocumentTypeManager({ initialTypes }: { initialTypes: DocType[] }) {
  const [types, setTypes] = useState<DocType[]>(initialTypes);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<DocType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: DocType) {
    setEditTarget(t);
    setForm({
      name: t.name,
      description: t.description ?? "",
      isRequired: t.isRequired,
      maxSizeMb: String(t.maxSizeMb),
      allowedTypes: t.allowedTypes.join(","),
      order: String(t.order),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allowedTypes = form.allowedTypes
      .split(",")
      .map((s) => s.trim().toLowerCase().replace(/^\./, ""))
      .filter(Boolean);
    if (!form.name.trim()) return toast.error("Nama wajib diisi");
    if (allowedTypes.length === 0) return toast.error("Minimal satu format file (mis. pdf, jpg)");

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        isRequired: form.isRequired,
        maxSizeMb: Number(form.maxSizeMb) || 2,
        allowedTypes,
        order: Number(form.order) || 0,
      };
      const url = editTarget ? `/api/admin/document-types/${editTarget.id}` : "/api/admin/document-types";
      const method = editTarget ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved: DocType = await res.json();
        setTypes((prev) =>
          editTarget
            ? prev.map((t) => (t.id === saved.id ? saved : t))
            : [...prev, saved].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        );
        setShowForm(false);
        toast.success(editTarget ? "Jenis dokumen diperbarui" : "Jenis dokumen ditambahkan");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Gagal menyimpan");
      }
    });
  }

  function handleToggleActive(t: DocType) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/document-types/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      if (res.ok) {
        setTypes((prev) => prev.map((x) => (x.id === t.id ? { ...x, isActive: !t.isActive } : x)));
        toast.success(!t.isActive ? "Jenis dokumen diaktifkan" : "Jenis dokumen dinonaktifkan");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Gagal mengubah status");
      }
    });
  }

  function handleDelete(t: DocType) {
    if (!confirm(`Hapus jenis dokumen "${t.name}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/document-types/${t.id}`, { method: "DELETE" });
      if (res.ok) {
        setTypes((prev) => prev.filter((x) => x.id !== t.id));
        toast.success("Jenis dokumen dihapus");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Gagal menghapus");
      }
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Jenis Dokumen Pendaftaran
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dokumen yang diminta kepada pendaftar di formulir PPDB
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-blue-100 rounded-lg p-4 space-y-3 bg-blue-50/50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800">
              {editTarget ? "Edit Jenis Dokumen" : "Jenis Dokumen Baru"}
            </p>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              title="Tutup"
              aria-label="Tutup form jenis dokumen"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nama <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Contoh: Pas Foto 3x4"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
              <input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Catatan untuk pendaftar (opsional)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Format File (pisah koma) <span className="text-red-500">*</span></label>
              <input
                value={form.allowedTypes}
                onChange={(e) => set("allowedTypes", e.target.value)}
                placeholder="pdf,jpg,jpeg,png"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Maks. Ukuran (MB)</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxSizeMb}
                  onChange={(e) => set("maxSizeMb", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Urutan</label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => set("order", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => set("isRequired", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Wajib diunggah pendaftar</span>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      )}

      {types.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
          Belum ada jenis dokumen. Tambahkan agar pendaftar diminta mengunggah berkas (mis. pas foto, KK).
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {types.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                  {t.name}
                  {t.isRequired && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Wajib</span>
                  )}
                  {!t.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {t.allowedTypes.join(", ")} · maks {t.maxSizeMb}MB{t.description ? ` · ${t.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(t)}
                  disabled={isPending}
                  title={t.isActive ? "Nonaktifkan (tidak muncul di form pendaftaran)" : "Aktifkan"}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    t.isActive
                      ? "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  {t.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => openEdit(t)}
                  title="Edit"
                  aria-label={`Edit ${t.name}`}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  disabled={isPending}
                  title="Hapus"
                  aria-label={`Hapus ${t.name}`}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
