"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import {
  CheckSquare, Plus, Trash2, Users, Loader2, X, ChevronDown, ChevronUp, QrCode,
} from "lucide-react";

interface AttendanceClass { id: string; name: string }
interface AttendanceItem {
  id: string;
  classId: string;
  date: string;
  class: AttendanceClass;
  _count: { records: number };
}
interface StudentRecord {
  id: string;
  name: string;
  avatar: string | null;
  status: "HADIR" | "SAKIT" | "IZIN" | "ALPHA";
  note: string;
}

interface AbsensiGuruClientProps {
  classes: AttendanceClass[];
  initialAttendances: AttendanceItem[];
}

const STATUS_OPTIONS = [
  { value: "HADIR", label: "Hadir", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "SAKIT", label: "Sakit", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "IZIN", label: "Izin", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "ALPHA", label: "Alpha", color: "bg-red-100 text-red-700 border-red-300" },
] as const;

export default function AbsensiGuruClient({ classes, initialAttendances }: AbsensiGuruClientProps) {
  const [attendances, setAttendances] = useState<AttendanceItem[]>(initialAttendances);
  const [filterClass, setFilterClass] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ classId: "", date: new Date().toISOString().slice(0, 10) });
  const [createError, setCreateError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [inputSesiId, setInputSesiId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loadingInput, setLoadingInput] = useState(false);
  const [savingInput, setSavingInput] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = attendances.filter((a) => !filterClass || a.classId === filterClass);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    startTransition(async () => {
      const res = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error ?? "Gagal membuat sesi");
        return;
      }
      const newItem: AttendanceItem = await res.json();
      setAttendances((prev) => [newItem, ...prev]);
      setShowCreate(false);
      setCreateForm({ classId: "", date: new Date().toISOString().slice(0, 10) });
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus sesi absensi ini?")) return;
    const res = await fetch(`/api/absensi/${id}`, { method: "DELETE" });
    if (res.ok) setAttendances((prev) => prev.filter((a) => a.id !== id));
  }

  async function openInput(item: AttendanceItem) {
    setInputSesiId(item.id);
    setLoadingInput(true);
    try {
      const res = await fetch(`/api/absensi/${item.id}`);
      const data = await res.json();
      const existingRecords: Record<string, { status: string; note: string }> = {};
      for (const r of data.records ?? []) {
        existingRecords[r.studentId] = { status: r.status, note: r.note ?? "" };
      }
      const studentList: StudentRecord[] = (data.class?.students ?? []).map(
        (cs: { student: { id: string; name: string; avatar: string | null } }) => ({
          id: cs.student.id,
          name: cs.student.name,
          avatar: cs.student.avatar,
          status: (existingRecords[cs.student.id]?.status ?? "HADIR") as StudentRecord["status"],
          note: existingRecords[cs.student.id]?.note ?? "",
        })
      );
      setStudents(studentList);
    } finally {
      setLoadingInput(false);
    }
  }

  async function handleSaveRecords() {
    if (!inputSesiId) return;
    setSavingInput(true);
    try {
      const res = await fetch(`/api/absensi/${inputSesiId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: students.map((s) => ({ studentId: s.id, status: s.status, note: s.note })) }),
      });
      if (res.ok) {
        const { count } = await res.json();
        setAttendances((prev) =>
          prev.map((a) => a.id === inputSesiId ? { ...a, _count: { records: count } } : a)
        );
        setInputSesiId(null);
      }
    } finally {
      setSavingInput(false);
    }
  }

  function updateStudent(id: string, field: "status" | "note", value: string) {
    setStudents((prev) =>
      prev.map((s) => s.id === id ? { ...s, [field]: value } : s)
    );
  }

  function setAllStatus(status: StudentRecord["status"]) {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none max-w-xs"
        >
          <option value="">Semua Kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Buat Sesi Absensi
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sesi Absensi Baru</h3>
            <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            {createError && <p className="w-full text-sm text-red-600">{createError}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Kelas *</label>
              <select
                required
                value={createForm.classId}
                onChange={(e) => setCreateForm((p) => ({ ...p, classId: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Pilih kelas</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tanggal *</label>
              <input
                type="date"
                required
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Buat
            </button>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <CheckSquare className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada sesi absensi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.class.name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.date), "EEEE, d MMMM yyyy", { locale: localeId })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    {item._count.records}
                  </span>
                  <Link
                    href={`/guru/absensi/${item.id}/qr`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <QrCode className="h-3.5 w-3.5" /> QR
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); openInput(item); }}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Input
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {expandedId === item.id ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inputSesiId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Input Absensi</h2>
              <button onClick={() => setInputSesiId(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {loadingInput ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              <>
                <div className="border-b px-6 py-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600 mr-2">Set semua:</span>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setAllStatus(s.value)}
                      className={`rounded-lg border px-2 py-1 text-xs font-medium ${s.color}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
                  {students.map((s, idx) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                      <span className="w-6 text-xs text-gray-500 flex-shrink-0">{idx + 1}.</span>
                      <p className="flex-1 text-sm font-medium text-gray-900 min-w-0 truncate">{s.name}</p>
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateStudent(s.id, "status", opt.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${s.status === opt.value ? opt.color + " shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={s.note}
                        onChange={(e) => updateStudent(s.id, "note", e.target.value)}
                        placeholder="Keterangan"
                        className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:border-green-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t px-6 py-4 flex justify-end gap-3">
                  <button
                    onClick={() => setInputSesiId(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveRecords}
                    disabled={savingInput || students.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingInput && <Loader2 className="h-4 w-4 animate-spin" />}
                    Simpan Absensi
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
