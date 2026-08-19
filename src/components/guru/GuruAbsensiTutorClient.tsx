"use client";

import { useState, useTransition } from "react";
import { LogIn, LogOut, QrCode, KeyRound, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface TodayRecord {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  method: string | null;
}

interface ClassItem { id: string; name: string }

interface RecordItem {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  method: string | null;
  class: { name: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  TIDAK_HADIR: "Tidak Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
};

const STATUS_COLOR: Record<string, string> = {
  HADIR: "bg-green-100 text-green-700",
  TERLAMBAT: "bg-yellow-100 text-yellow-700",
  TIDAK_HADIR: "bg-red-100 text-red-700",
  IZIN: "bg-blue-100 text-blue-700",
  SAKIT: "bg-purple-100 text-purple-700",
};

export default function GuruAbsensiTutorClient({
  todayRecord,
  classes,
  recentRecords,
}: {
  todayRecord: TodayRecord | null;
  classes: ClassItem[];
  recentRecords: RecordItem[];
}) {
  const [mode, setMode] = useState<"manual" | "code">("manual");
  const [code, setCode] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showQR, setShowQR] = useState(false);

  function handleCheckIn() {
    startTransition(async () => {
      const body: Record<string, unknown> = { action: "check_in" };
      if (mode === "code") {
        body.code = code.trim();
      } else if (selectedClass) {
        body.classId = selectedClass;
      }
      const res = await fetch("/api/guru/absensi-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Berhasil check-in");
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Gagal check-in");
      }
    });
  }

  function handleCheckOut() {
    startTransition(async () => {
      const res = await fetch("/api/guru/absensi-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_out" }),
      });
      if (res.ok) {
        toast.success("Berhasil check-out");
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Gagal check-out");
      }
    });
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Today Status Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Hari ini</p>
            <p className="text-lg font-semibold text-gray-900">{todayStr}</p>
          </div>
          {todayRecord && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[todayRecord.status] ?? "bg-gray-100"}`}>
              {STATUS_LABEL[todayRecord.status] ?? todayRecord.status}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Check-in</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {todayRecord?.checkIn
                ? new Date(todayRecord.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <LogOut className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Check-out</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {todayRecord?.checkOut
                ? new Date(todayRecord.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!todayRecord?.checkIn && (
            <button
              onClick={handleCheckIn}
              disabled={isPending || (mode === "code" && !code.trim()) || (mode === "manual" && !selectedClass)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" /> Check-in
            </button>
          )}
          {todayRecord?.checkIn && !todayRecord?.checkOut && (
            <button
              onClick={handleCheckOut}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" /> Check-out
            </button>
          )}
          {todayRecord?.checkIn && todayRecord?.checkOut && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-600" /> Absensi hari ini selesai
            </div>
          )}
        </div>
      </div>

      {/* Check-in Method */}
      {!todayRecord?.checkIn && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Metode Check-in</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <Clock className="h-4 w-4" /> Pilih Kelas
            </button>
            <button
              onClick={() => setMode("code")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${mode === "code" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <KeyRound className="h-4 w-4" /> Kode Kelas
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${showQR ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <QrCode className="h-4 w-4" /> QR Code
            </button>
          </div>

          {mode === "manual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Pilih kelas...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {mode === "code" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Masukkan Kode Kelas</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: cls_abc123..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Kode kelas bisa didapat dari admin atau QR Code di ruangan</p>
            </div>
          )}

          {showQR && (
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <QrCode className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700">Scan QR Code di ruangan kelas untuk check-in otomatis</p>
              <p className="text-xs text-blue-500 mt-1">Fitur QR scanner akan tersedia di modul mobile</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Records */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Riwayat Absensi (30 hari terakhir)</h2>
        </div>
        {recentRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada riwayat absensi</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(r.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.checkIn && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <LogIn className="h-3 w-3" /> {new Date(r.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {r.checkOut && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <LogOut className="h-3 w-3" /> {new Date(r.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {r.class && <span className="text-xs text-gray-400">· {r.class.name}</span>}
                    {r.method && <span className="text-xs text-gray-400">· {r.method}</span>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? "bg-gray-100"}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
