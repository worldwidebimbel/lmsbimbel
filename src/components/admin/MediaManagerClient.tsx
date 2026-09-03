"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import {
  Upload, Search, Trash2, Copy, Check, Loader2,
  Image as ImageIcon, FileText, File, Grid3X3, List,
  X, ExternalLink, FolderOpen,
} from "lucide-react";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  publicId: string;
  resourceType: string;
  mimeType: string | null;
  size: number | null;
  folder: string;
  createdAt: string;
  uploadedBy: { name: string; role: string };
}

function fileIcon(mimeType: string | null, resourceType: string) {
  if (resourceType === "image" || mimeType?.startsWith("image/"))
    return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (mimeType === "application/pdf")
    return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_FILTERS = [
  { label: "Semua", value: "" },
  { label: "Gambar", value: "image" },
  { label: "Dokumen", value: "raw" },
];

export default function MediaManagerClient({
  initialFiles,
  initialTotal,
}: {
  initialFiles: MediaFile[];
  initialTotal: number;
}) {
  const [files, setFiles] = useState<MediaFile[]>(initialFiles);
  const [total, setTotal] = useState(initialTotal);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 60;

  async function fetchFiles(p = 1, type = typeFilter, q = search) {
    const params = new URLSearchParams({ page: String(p) });
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/media?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setFiles(data.files);
    setTotal(data.total);
    setPage(p);
  }

  function handleFilterChange(type: string) {
    setTypeFilter(type);
    startTransition(() => { fetchFiles(1, type, search); });
  }

  function handleSearch(q: string) {
    setSearch(q);
    startTransition(() => { fetchFiles(1, typeFilter, q); });
  }

  async function uploadFiles(rawFiles: FileList | File[]) {
    setUploading(true);
    setMsg("");
    const arr = Array.from(rawFiles);
    let uploaded = 0;
    for (const f of arr) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("folder", "media-manager");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) uploaded++;
    }
    setMsg(`${uploaded}/${arr.length} file berhasil diupload.`);
    setUploading(false);
    fetchFiles(1, typeFilter, search);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }, [typeFilter, search]);

  async function copyUrl(file: MediaFile) {
    await navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteFile(id: string) {
    if (!confirm("Hapus file ini dari Cloudinary dan database?")) return;
    setDeleting(id);
    const res = await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setTotal((t) => t - 1);
      if (preview?.id === id) setPreview(null);
    }
    setDeleting(null);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} file tersimpan di Cloudinary</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm"
        >
          <Upload className="w-4 h-4" /> Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
        />
      </div>

      {msg && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 flex items-center justify-between">
          {msg}
          <button onClick={() => setMsg("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50"}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Mengupload...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">Drag & drop file ke sini, atau <button className="text-indigo-600 underline" onClick={() => fileInputRef.current?.click()}>pilih file</button></p>
            <p className="text-xs text-gray-500">Gambar (maks 20MB), PDF/DOC/PPT/XLS (maks 50MB)</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cari nama file..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${typeFilter === f.value ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
        {isPending && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setPreview(f)}
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {f.resourceType === "image" ? (
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 p-3">
                    {fileIcon(f.mimeType, f.resourceType)}
                    <span className="text-[10px] text-gray-500 text-center break-all leading-tight">
                      {f.mimeType?.split("/")[1]?.toUpperCase() ?? "FILE"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate font-medium" title={f.name}>{f.name}</p>
                <p className="text-[10px] text-gray-500">{formatSize(f.size)}</p>
              </div>
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}>
                <button onClick={() => copyUrl(f)} title="Salin URL"
                  className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg bg-white text-gray-700 hover:bg-indigo-50">
                  {copiedId === f.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a href={f.url} target="_blank" rel="noreferrer" title="Buka di tab baru"
                  className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg bg-white text-gray-700 hover:bg-indigo-50">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => deleteFile(f.id)} disabled={deleting === f.id} title="Hapus"
                  className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg bg-white text-red-500 hover:bg-red-50 disabled:opacity-50">
                  {deleting === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <div className="col-span-6 text-center py-16 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              Belum ada file media.
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">File</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Folder</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Ukuran</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Uploader</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {f.resourceType === "image" ? (
                        <img src={f.url} alt={f.name} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          {fileIcon(f.mimeType, f.resourceType)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate max-w-[200px]">{f.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{f.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.folder}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatSize(f.size)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{f.uploadedBy.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(f.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => copyUrl(f)} title="Salin URL"
                        className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                        {copiedId === f.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a href={f.url} target="_blank" rel="noreferrer" title="Buka di tab baru"
                        className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => deleteFile(f.id)} disabled={deleting === f.id} title="Hapus"
                        className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50">
                        {deleting === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Belum ada file media.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Menampilkan {files.length} dari {total} file</span>
          <div className="flex gap-1">
            <button onClick={() => fetchFiles(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <span className="px-3 py-1.5 font-medium">{page}/{totalPages}</span>
            <button onClick={() => fetchFiles(page + 1)} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 truncate">{preview.name}</h3>
              <button onClick={() => setPreview(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {preview.resourceType === "image" ? (
                <div className="flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden max-h-96">
                  <img src={preview.url} alt={preview.name} className="max-h-96 max-w-full object-contain" />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-6">
                  {fileIcon(preview.mimeType, preview.resourceType)}
                  <div>
                    <p className="font-medium text-gray-800">{preview.name}</p>
                    <p className="text-sm text-gray-500">{preview.mimeType} · {formatSize(preview.size)}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-500 shrink-0">URL:</span>
                  <span className="text-gray-700 text-xs truncate flex-1">{preview.url}</span>
                  <button onClick={() => copyUrl(preview)} className="shrink-0 p-1 rounded hover:bg-gray-200">
                    {copiedId === preview.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-gray-500">
                  <div><span className="text-gray-500">Ukuran:</span> {formatSize(preview.size)}</div>
                  <div><span className="text-gray-500">Folder:</span> {preview.folder}</div>
                  <div><span className="text-gray-500">Upload:</span> {formatDate(preview.createdAt)}</div>
                  <div className="col-span-2"><span className="text-gray-500">Oleh:</span> {preview.uploadedBy.name} ({preview.uploadedBy.role})</div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <a href={preview.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4" /> Buka
                </a>
                <button onClick={() => copyUrl(preview)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">
                  {copiedId === preview.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedId === preview.id ? "Tersalin!" : "Salin URL"}
                </button>
                <button onClick={() => deleteFile(preview.id)} disabled={deleting === preview.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm disabled:opacity-50 ml-auto">
                  {deleting === preview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
