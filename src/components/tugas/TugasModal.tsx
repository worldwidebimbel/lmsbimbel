"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { AssignmentItem, AssignmentClass } from "./types";

interface TugasModalProps {
  classes: AssignmentClass[];
  editItem?: AssignmentItem | null;
  onClose: () => void;
  onSaved: (item: AssignmentItem) => void;
}

export default function TugasModal({ classes, editItem, onClose, onSaved }: TugasModalProps) {
  const isEdit = !!editItem;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: editItem?.title ?? "",
    description: editItem?.description ?? "",
    classId: editItem?.classId ?? "",
    dueDate: editItem?.dueDate
      ? new Date(editItem.dueDate).toISOString().slice(0, 16)
      : "",
    maxScore: editItem?.maxScore ?? 100,
    fileUrl: editItem?.fileUrl ?? "",
    isPublished: editItem?.isPublished ?? false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/tugas/${editItem!.id}` : "/api/tugas";
        const method = isEdit ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, maxScore: Number(form.maxScore) }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Gagal menyimpan tugas");
          return;
        }

        const saved: AssignmentItem = await res.json();
        onSaved(saved);
        onClose();
      } catch {
        setError("Terjadi kesalahan jaringan");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Tugas" : "Buat Tugas Baru"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Judul Tugas *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: Latihan Soal Aljabar Bab 3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi / Instruksi</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Instruksi pengerjaan tugas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kelas *</label>
              <select
                name="classId"
                value={form.classId}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Pilih kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nilai Maks</label>
              <input
                name="maxScore"
                type="number"
                min={1}
                max={1000}
                value={form.maxScore}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deadline *</label>
            <input
              name="dueDate"
              type="datetime-local"
              value={form.dueDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">File Soal (URL opsional)</label>
            <input
              name="fileUrl"
              value={form.fileUrl}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://drive.google.com/..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="isPublished"
              type="checkbox"
              checked={form.isPublished}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Publikasikan sekarang</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Buat Tugas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
