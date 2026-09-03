"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X, Upload, Link2, Youtube, Loader2, FileText, CheckCircle } from "lucide-react";
import type { MaterialItem, MaterialClass, MaterialSubject } from "./types";

type Subject = MaterialSubject;
type Class = MaterialClass;
type Material = MaterialItem;

interface Props {
  classes: Class[];
  subjects: Subject[];
  editData: MaterialItem | null;
  onClose: () => void;
  onSaved: (material: MaterialItem) => void;
}

const MATERIAL_TYPES = [
  { value: "PDF", label: "PDF Document" },
  { value: "VIDEO", label: "Video File" },
  { value: "YOUTUBE", label: "YouTube Link" },
  { value: "PRESENTATION", label: "Presentasi (PPT)" },
  { value: "DOCUMENT", label: "Dokumen (Word)" },
  { value: "LINK", label: "Link Eksternal" },
  { value: "TEXT", label: "Teks / Artikel" },
];

export function MaterialUploadModal({ classes, subjects, editData, onClose, onSaved }: Props) {
  const isEdit = !!editData;
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: editData?.title ?? "",
    description: editData?.description ?? "",
    type: editData?.type ?? "PDF",
    classId: editData?.class?.id ?? "",
    subjectId: editData?.subject?.id ?? "",
    fileUrl: editData?.fileUrl ?? "",
    order: editData?.order ?? 0,
    isPublished: editData?.isPublished ?? false,
    chapterTitle: editData?.chapterTitle ?? "",
    chapterOrder: editData?.chapterOrder ?? 0,
    content: editData?.content ?? "",
    keyPoints: (editData?.keyPoints ?? []).join("\n"),
    tips: editData?.tips ?? "",
    slideCount: editData?.slideCount ?? "",
  });

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const showUrlInput = ["YOUTUBE", "LINK", "VIDEO"].includes(form.type);
  const showFileHint = ["PDF", "PRESENTATION", "DOCUMENT"].includes(form.type);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "materi");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "Gagal upload file");
        return;
      }
      set("fileUrl", d.url);
      toast.success("File berhasil diupload");
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    if (showUrlInput && !form.fileUrl.trim()) return toast.error("URL wajib diisi");
    if (showFileHint && !form.fileUrl.trim()) return toast.error("File belum diupload");

    startTransition(async () => {
      const url = isEdit ? `/api/materi/${editData!.id}` : "/api/materi";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classId: form.classId || null,
          subjectId: form.subjectId || null,
          fileUrl: form.fileUrl || null,
          fileSize: file?.size ?? null,
          chapterTitle: form.chapterTitle || null,
          content: form.content || null,
          keyPoints: form.keyPoints.split("\n").map((s) => s.trim()).filter(Boolean),
          tips: form.tips || null,
          slideCount: form.slideCount ? Number(form.slideCount) : null,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        onSaved(saved);
        toast.success(isEdit ? "Materi diperbarui" : "Materi berhasil ditambahkan");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Gagal menyimpan materi");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Materi" : "Upload Materi Baru"}
          </h2>
          <button onClick={onClose} title="Tutup" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Judul */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Contoh: Persamaan Kuadrat - Bab 3"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipe */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Tipe Materi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MATERIAL_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("type", t.value)}
                  className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                    form.type === t.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* URL input */}
          {showUrlInput && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {form.type === "YOUTUBE" ? "URL YouTube" : "URL File/Link"}
                <span className="text-red-500"> *</span>
              </label>
              <div className="relative">
                {form.type === "YOUTUBE" ? (
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                ) : (
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
                <input
                  value={form.fileUrl}
                  onChange={(e) => set("fileUrl", e.target.value)}
                  placeholder={form.type === "YOUTUBE" ? "https://youtube.com/watch?v=..." : "https://..."}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* File upload */}
          {showFileHint && (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              {!file && !form.fileUrl && (
                <>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload file {form.type}</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, PPT, DOC, DOCX (maks 50MB)</p>
                </>
              )}
              {file && !form.fileUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Mengupload..." : "Upload File"}
                  </button>
                </div>
              )}
              {form.fileUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>File berhasil diupload</span>
                  </div>
                  <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                    {form.fileUrl}
                  </a>
                  <div>
                    <button
                      type="button"
                      onClick={() => { setFile(null); set("fileUrl", ""); }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Ganti file
                    </button>
                  </div>
                </div>
              )}
              <label className="block mt-3 cursor-pointer">
                <input
                  type="file"
                  accept={
                    form.type === "PDF"
                      ? ".pdf,application/pdf"
                      : form.type === "PRESENTATION"
                      ? ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      : ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  }
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {form.fileUrl ? "Pilih file lain" : "Pilih file"}
                </span>
              </label>
            </div>
          )}

          {/* Bab / Chapter */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Judul Bab (opsional)
              </label>
              <input
                value={form.chapterTitle}
                onChange={(e) => set("chapterTitle", e.target.value)}
                placeholder="Contoh: Bab 1: Structure Basics"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Materi dengan judul Bab yang sama akan dikelompokkan sebagai rangkaian aktivitas berurutan.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Urutan Bab
              </label>
              <input
                type="number"
                min={0}
                value={form.chapterOrder}
                onChange={(e) => set("chapterOrder", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Konten Halaman Belajar */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              {form.type === "TEXT" ? "Isi Artikel" : "Ringkasan Materi"}
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={5}
              placeholder={form.type === "TEXT"
                ? "Gunakan # Judul, ## Sub Judul, **tebal**, baris `1. item` untuk daftar bernomor, dan tabel dengan | Kolom | Kolom |"
                : "Ringkasan singkat materi yang ditampilkan di bawah video/slide..."}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Poin Penting (satu per baris)
              </label>
              <textarea
                value={form.keyPoints}
                onChange={(e) => set("keyPoints", e.target.value)}
                rows={3}
                placeholder={"Jenis-jenis Soal Structure\nAturan grammar penting\nStrategi menjawab soal"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Tips Belajar
              </label>
              <textarea
                value={form.tips}
                onChange={(e) => set("tips", e.target.value)}
                rows={3}
                placeholder="Tonton video sampai selesai, catat poin penting..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {form.type === "PRESENTATION" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Jumlah Slide
              </label>
              <input
                type="number"
                min={0}
                value={form.slideCount}
                onChange={(e) => set("slideCount", e.target.value)}
                placeholder="18"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Mata Pelajaran */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Mata Pelajaran
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => set("subjectId", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Pilih --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Kelas (Opsional)
              </label>
              <select
                value={form.classId}
                onChange={(e) => set("classId", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Semua Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat tentang materi ini..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Urutan & Publish */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Urutan</label>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set("order", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set("isPublished", !form.isPublished)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isPublished ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-gray-700">Publikasikan</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Materi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
