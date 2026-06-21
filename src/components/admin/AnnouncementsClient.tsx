"use client";

import { useState, useTransition } from "react";
import { Megaphone, Loader2, Send, Users, Info, AlertTriangle, CheckCircle } from "lucide-react";

const ROLES = [
  { value: "", label: "Semua Pengguna" },
  { value: "SISWA", label: "Hanya Siswa" },
  { value: "GURU", label: "Hanya Guru" },
  { value: "ORANG_TUA", label: "Hanya Orang Tua" },
];

const TYPES = [
  { value: "INFO", label: "Info", Icon: Info, color: "text-blue-500" },
  { value: "SUCCESS", label: "Sukses", Icon: CheckCircle, color: "text-green-500" },
  { value: "WARNING", label: "Peringatan", Icon: AlertTriangle, color: "text-yellow-500" },
];

interface Props {
  branches: { id: string; name: string; code: string }[];
  isSuperAdmin: boolean;
  defaultBranchId: string | null;
}

export default function AnnouncementsClient({ branches, isSuperAdmin, defaultBranchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "INFO",
    targetRole: "",
    link: "",
    branchId: defaultBranchId ?? "",
  });

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setResult(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal mengirim pengumuman");
        return;
      }
      const data = await res.json();
      setResult(data);
      setForm({ title: "", content: "", type: "INFO", targetRole: "", link: "", branchId: defaultBranchId ?? "" });
    });
  }

  return (
    <div className="space-y-5">
      {result && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-700">
            Pengumuman berhasil dikirim ke <strong>{result.sent}</strong> pengguna.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Buat Pengumuman</h3>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Judul *</label>
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Judul pengumuman"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Isi Pengumuman *</label>
          <textarea
            required
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            rows={4}
            placeholder="Tulis isi pengumuman di sini..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipe</label>
            <div className="flex gap-2">
              {TYPES.map(({ value, label, Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("type", value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    form.type === value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${form.type === value ? "text-blue-500" : color}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Kirim ke</label>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
              <Users className="h-4 w-4 text-gray-400 shrink-0" />
              <select
                value={form.targetRole}
                onChange={(e) => update("targetRole", e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Link Terkait <span className="text-gray-400">(opsional)</span></label>
          <input
            type="url"
            value={form.link}
            onChange={(e) => update("link", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {branches.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Cabang</label>
            {isSuperAdmin ? (
              <select
                value={form.branchId}
                onChange={(e) => update("branchId", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Global (semua cabang)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-700">
                {branches.find((b) => b.id === form.branchId)?.name ?? "Cabang default"}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim Pengumuman
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 text-sm">Tips Penggunaan</h3>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-500">
          <li>• Pilih <strong>Semua Pengguna</strong> untuk broadcast ke seluruh user aktif</li>
          <li>• Notifikasi akan muncul di bell icon header setiap pengguna</li>
          <li>• Tambahkan <strong>Link Terkait</strong> agar pengguna bisa langsung navigasi</li>
          <li>• Tipe <strong>Peringatan</strong> cocok untuk deadline/jadwal mendesak</li>
        </ul>
      </div>
    </div>
  );
}
