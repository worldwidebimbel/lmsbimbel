"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { Copy, RefreshCw, CheckCircle, Users } from "lucide-react";

interface Props {
  attendanceId: string;
  className: string;
  date: string;
  baseUrl: string;
}

export default function AbsensiQRDisplay({ attendanceId, className, date, baseUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [records, setRecords] = useState<{ name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const qrUrl = `${baseUrl}/siswa/absensi/scan?token=${attendanceId}`;

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch(`/api/absensi/${attendanceId}`);
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch (_) {}
    setLoading(false);
  }

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 10000);
    return () => clearInterval(interval);
  }, [attendanceId]);

  function handleCopy() {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hadir = records.filter((r) => r.status === "HADIR").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{className}</p>
          <p className="text-sm text-gray-500">
            {new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="rounded-xl border-4 border-blue-500 p-3 shadow-lg">
          <QRCodeSVG value={qrUrl} size={220} fgColor="#1d4ed8" bgColor="#ffffff" />
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <span className="truncate max-w-[220px]">{qrUrl}</span>
          <button onClick={handleCopy} className="shrink-0 rounded p-1 hover:bg-gray-200">
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Tunjukkan QR ini kepada siswa untuk scan kehadiran otomatis
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Siswa Sudah Hadir</h3>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{hadir}</span>
          </div>
          <button
            onClick={fetchRecords}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {records.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">Belum ada siswa yang scan</div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {records.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5">
                <span className="text-sm text-gray-800">{r.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r.status === "HADIR" ? "bg-green-100 text-green-700" :
                  r.status === "SAKIT" ? "bg-blue-100 text-blue-700" :
                  r.status === "IZIN" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
