"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

// ============================================================
// Media picker modal — pilih gambar dari Media Manager
// (Cloudinary, via GET /api/admin/media?type=image).
// Dipakai Section Builder (HERO bgImage, HEADER logoUrl,
// avatar testimoni) agar hasil AI DESIGN / upload Media
// Manager tinggal dipilih tanpa copy-paste URL.
// List media hanya bisa diakses SUPER_ADMIN & ADMIN (sama
// dengan halaman Media Manager) — role lain tetap bisa
// menempel URL manual di field.
// ============================================================

interface PickerFile {
  id: string;
  name: string;
  url: string;
}

export default function MediaPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<PickerFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / 60));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ type: "image", page: String(page) });
        if (q) params.set("q", q);
        const res = await fetch(`/api/admin/media?${params}`);
        if (cancelled) return;
        if (!res.ok) {
          setFiles([]);
          setTotal(0);
          setError(
            res.status === 403
              ? "Media Manager hanya bisa diakses Admin/Super Admin — tempel URL gambar secara manual di field."
              : "Gagal memuat daftar media."
          );
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setFiles(data.files ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!cancelled) setError("Gagal memuat daftar media.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-gray-900">Pilih Gambar</h3>
            <p className="text-xs text-gray-500">Dari Media Manager (Cloudinary)</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Tutup">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(search);
          }}
          className="flex gap-2 border-b border-gray-100 px-5 py-3"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama file..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Cari
          </button>
        </form>

        <div className="min-h-[200px] flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">Memuat media...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
          ) : files.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-500">
              Tidak ada gambar{q ? " untuk kata kunci ini" : ""}. Upload lewat CMS → Media Manager terlebih dahulu.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelect(f.url)}
                  title={f.name}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-indigo-400 hover:ring-2 hover:ring-indigo-200"
                >
                  <span className="block aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={f.url}
                      alt={f.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </span>
                  <span className="block truncate px-1.5 py-1 text-[10px] text-gray-600">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && !error && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm text-gray-500">
            <span>{total} gambar</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 font-medium">
                {page}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
