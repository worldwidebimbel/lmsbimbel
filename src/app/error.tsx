"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Terjadi Kesalahan</h1>
          <p className="text-sm text-gray-500">
            Maaf, halaman ini tidak dapat dimuat saat ini. Coba muat ulang, atau kembali beberapa saat lagi.
          </p>
          {error.digest && (
            <p className="pt-1 font-mono text-[10px] text-gray-300">Kode: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <RotateCw className="h-4 w-4" /> Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <Home className="h-4 w-4" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
