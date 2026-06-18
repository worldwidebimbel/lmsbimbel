"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, QrCode } from "lucide-react";
import Link from "next/link";

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [message, setMessage] = useState("");
  const [sessionInfo, setSessionInfo] = useState<{ className: string; date: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token tidak valid");
      return;
    }

    async function doScan() {
      try {
        const infoRes = await fetch(`/api/absensi/qr/${token}`);
        if (!infoRes.ok) {
          const err = await infoRes.json();
          setStatus("error");
          setMessage(err.error ?? "Sesi tidak ditemukan");
          return;
        }
        const info = await infoRes.json();
        setSessionInfo({ className: info.className, date: info.date });

        const res = await fetch(`/api/absensi/qr/${token}`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Gagal mencatat kehadiran");
          return;
        }
        setMessage(data.message);
        setStatus(data.alreadyMarked ? "already" : "success");
      } catch (_) {
        setStatus("error");
        setMessage("Terjadi kesalahan, coba lagi");
      }
    }

    doScan();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center space-y-5">
        <div className="flex justify-center">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${
            status === "loading" ? "bg-blue-50" :
            status === "success" ? "bg-green-50" :
            status === "already" ? "bg-yellow-50" :
            "bg-red-50"
          }`}>
            {status === "loading" && <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />}
            {status === "success" && <CheckCircle className="h-10 w-10 text-green-500" />}
            {status === "already" && <CheckCircle className="h-10 w-10 text-yellow-500" />}
            {status === "error" && <XCircle className="h-10 w-10 text-red-500" />}
          </div>
        </div>

        {sessionInfo && (
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="font-semibold text-gray-900">{sessionInfo.className}</p>
            <p className="text-sm text-gray-500">
              {new Date(sessionInfo.date).toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        )}

        <div>
          <h2 className={`text-xl font-bold ${
            status === "loading" ? "text-blue-600" :
            status === "success" ? "text-green-600" :
            status === "already" ? "text-yellow-600" :
            "text-red-600"
          }`}>
            {status === "loading" && "Memproses..."}
            {status === "success" && "Kehadiran Tercatat!"}
            {status === "already" && "Sudah Tercatat"}
            {status === "error" && "Gagal"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{message}</p>
        </div>

        <Link
          href="/siswa/absensi"
          className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Lihat Rekap Absensi
        </Link>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
