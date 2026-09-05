"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-amber-700"
      >
        <Printer className="h-4 w-4" />
        Cetak / Simpan PDF
      </button>
    </div>
  );
}

export function VerifyNote({ code }: { code: string }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <p className="no-print absolute bottom-4 left-0 right-0 mt-4 text-center text-xs text-gray-500">
      Verifikasi sertifikat: {url}
      &nbsp;· Kode: {code}
      &nbsp;· <a href="/sertifikat" className="underline hover:text-gray-700">Verifikasi kode lain</a>
    </p>
  );
}
