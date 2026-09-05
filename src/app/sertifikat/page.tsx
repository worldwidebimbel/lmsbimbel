"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search } from "lucide-react";

export default function VerifySertifikatPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Masukkan kode verifikasi sertifikat.");
      return;
    }
    router.push(`/sertifikat/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Verifikasi Sertifikat</h1>
            <p className="text-sm text-gray-500">Periksa keaslian sertifikat secara publik</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label htmlFor="cert-code" className="block text-sm font-medium text-gray-700">
            Kode Verifikasi
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="cert-code"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="mis. 7KQ2RWYT9XBZ"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm font-mono uppercase tracking-widest focus:border-amber-500 focus:outline-none"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Verifikasi
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <p className="mt-6 text-xs text-gray-400">
          Kode tercetak pada sertifikat (bagian &quot;Kode Verifikasi&quot;) atau pindai QR di sertifikat untuk membuka halaman verifikasi secara langsung.
        </p>
      </div>
    </div>
  );
}
