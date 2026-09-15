"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Subject { id: string; name: string; code: string; color: string }
interface Teacher { id: string; name: string }
interface Branch { id: string; name: string; code: string }
interface Room { id: string; name: string; roomNumber: string | null }

export default function NewClassClient({ subjects, teachers, branches, rooms, defaultBranchId, isSuperAdmin }: { subjects: Subject[]; teachers: Teacher[]; branches: Branch[]; rooms: Room[]; defaultBranchId: string | null; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    subjectId: "",
    newSubjectName: "",
    teacherId: "",
    branchId: defaultBranchId ?? "",
    type: "REGULER",
    maxStudents: "30",
    room: "",
    startDate: "",
    endDate: "",
  });
  const [subjectMode, setSubjectMode] = useState<"select" | "new">("select");
  const [subjectsState, setSubjectsState] = useState<Subject[]>(subjects);

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        ...form,
        roomId: form.room || null,
        maxStudents: Number(form.maxStudents),
      };
      // Mode "new": kirim newSubjectName, bukan subjectId — API
      // akan buat Subject baru lalu pakai ID-nya.
      if (subjectMode === "new") {
        payload.newSubjectName = form.newSubjectName.trim();
        payload.subjectId = null;
      } else {
        payload.subjectId = form.subjectId || null;
        payload.newSubjectName = null;
      }
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal membuat kelas");
        return;
      }
      const cls = await res.json();
      router.push(`/admin/classes/${cls.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Kelas *</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Contoh: Matematika Dasar A"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
          {subjectMode === "select" ? (
            <div className="flex gap-2">
              <select
                value={form.subjectId}
                onChange={(e) => update("subjectId", e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">— Tanpa Mapel —</option>
                {subjectsState.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              <button
                type="button"
                onClick={() => setSubjectMode("new")}
                className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                title="Buat mapel baru"
              >
                + Mapel Baru
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={form.newSubjectName}
                onChange={(e) => update("newSubjectName", e.target.value)}
                placeholder="Nama mapel baru (mis. AI Learning)"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setSubjectMode("select"); update("newSubjectName", ""); }}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Pilih
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Opsional — kosongkan untuk kelas di luar lingkup sekolah (mis. AI Learning, Kewirausahaan).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Guru Pengajar *</label>
          <select
            required
            value={form.teacherId}
            onChange={(e) => update("teacherId", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Pilih guru</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {isSuperAdmin && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Cabang *</label>
            <select
              required
              value={form.branchId}
              onChange={(e) => update("branchId", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Pilih cabang</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipe Kelas</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="REGULER">Reguler</option>
            <option value="PRIVAT">Privat</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Maks. Siswa</label>
          <input
            type="number"
            min={1}
            max={100}
            value={form.maxStudents}
            onChange={(e) => update("maxStudents", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Ruangan</label>
          <select
            value={form.room}
            onChange={(e) => update("room", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">— Tanpa ruangan —</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.roomNumber ? ` (${r.roomNumber})` : ""}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tanggal Mulai</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Tanggal Selesai</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Deskripsi singkat kelas"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Link href="/admin/classes" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Batal
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Buat Kelas
        </button>
      </div>
    </form>
  );
}
