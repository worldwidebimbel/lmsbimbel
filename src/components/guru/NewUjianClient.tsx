"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface Class { id: string; name: string; subject: { name: string } }

export default function NewUjianClient({ classes }: { classes: Class[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", classId: "", duration: "60",
    startTime: "", endTime: "", isRandomized: false, passingScore: "60",
    maxAttempts: "1", scoringMode: "SUM",
  });

  function update(k: string, v: string | boolean) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    startTransition(async () => {
      const res = await fetch("/api/guru/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Gagal"); return; }
      const data = await res.json();
      router.push(`/guru/ujian/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Judul Ujian *</label>
        <input required value={form.title} onChange={(e) => update("title", e.target.value)}
          placeholder="Ujian Tengah Semester Matematika"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Kelas *</label>
        <select required value={form.classId} onChange={(e) => update("classId", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">Pilih kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.subject.name}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Deskripsi</label>
        <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
          rows={2} placeholder="Petunjuk pengerjaan..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Durasi (menit) *</label>
          <input required type="number" min={1} value={form.duration} onChange={(e) => update("duration", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nilai Lulus (%)</label>
          <input type="number" min={0} max={100} value={form.passingScore} onChange={(e) => update("passingScore", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Maks. Percobaan</label>
          <input type="number" min={1} max={10} value={form.maxAttempts} onChange={(e) => update("maxAttempts", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Mulai</label>
          <input type="datetime-local" value={form.startTime} onChange={(e) => update("startTime", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Selesai</label>
          <input type="datetime-local" value={form.endTime} onChange={(e) => update("endTime", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={form.isRandomized} onChange={(e) => update("isRandomized", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
        <span className="text-sm text-gray-700">Acak urutan soal</span>
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Mode Skor</label>
        <select value={form.scoringMode} onChange={(e) => update("scoringMode", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="SUM">Total Skor (sum per soal)</option>
          <option value="AVG">Rata-rata Skor</option>
          <option value="BEST">Skor Terbaik (dari semua percobaan)</option>
          <option value="LAST">Skor Percobaan Terakhir</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Link href="/guru/ujian" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Batal</Link>
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Buat & Tambah Soal
        </button>
      </div>
    </form>
  );
}
