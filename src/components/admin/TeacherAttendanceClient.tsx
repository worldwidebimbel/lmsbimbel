"use client";

import { useState, useTransition } from "react";
import { Calendar, Plus, Clock, CheckCircle, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

interface Teacher { id: string; name: string; email: string }
interface AttendanceRecordItem {
  id: string;
  teacherId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  method: string | null;
  note: string | null;
  verifiedAt: string | null;
  teacher: { name: string };
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

export default function TeacherAttendanceClient({ teachers, records: initial }: { teachers: Teacher[]; records: AttendanceRecordItem[] }) {
  const [records, setRecords] = useState<AttendanceRecordItem[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ teacherId: "", date: new Date().toISOString().split("T")[0], status: "HADIR", note: "" });
  const [isPending, startTransition] = useTransition();

  function handleVerify(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/absensi-tutor/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Absensi diverifikasi");
        setRecords((prev) => prev.map((r) => r.id === id ? { ...r, verifiedAt: new Date().toISOString() } : r));
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Gagal verifikasi");
      }
    });
  }

  function handleSubmit() {
    if (!form.teacherId || !form.date) {
      toast.error("Tutor dan tanggal wajib diisi");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Absensi tersimpan");
        setShowForm(false);
        const updated = await fetch("/api/admin/teacher-attendance").then((r) => r.json());
        setRecords(updated);
      } else {
        toast.error("Gagal menyimpan absensi");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Absensi Tutor</h1>
            <p className="text-sm text-gray-500">Catat kehadiran tutor harian</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Catat Absensi
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutor</label>
              <select
                value={form.teacherId}
                onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Pilih tutor</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Opsional"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Riwayat Absensi</h2>
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">Belum ada data absensi</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.teacher.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {new Date(r.date).toLocaleDateString("id-ID")}
                    </span>
                    {r.checkIn && (
                      <span className="text-xs text-gray-500 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {new Date(r.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {r.class && <span className="text-xs text-gray-500">· {r.class.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.verifiedAt && (
                    <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                      <BadgeCheck className="h-3 w-3" /> Terverifikasi
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? "bg-gray-100"}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  {!r.verifiedAt && (
                    <button
                      onClick={() => handleVerify(r.id)}
                      disabled={isPending}
                      className="rounded-lg p-1 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                      title="Verifikasi absensi"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
