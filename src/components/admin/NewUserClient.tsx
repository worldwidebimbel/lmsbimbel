"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const ROLES = [
  { value: "SISWA", label: "Siswa" },
  { value: "GURU", label: "Guru" },
  { value: "ADMIN", label: "Admin" },
  { value: "ADMIN_CABANG", label: "Admin Cabang" },
  { value: "ADMIN_KEUANGAN", label: "Admin Keuangan" },
  { value: "ADMIN_AKADEMIK", label: "Admin Akademik" },
  { value: "ORANG_TUA", label: "Orang Tua" },
  { value: "AFILIATOR", label: "Afiliator" },
];

interface Branch { id: string; name: string; code: string }

export default function NewUserClient({ branches, defaultBranchId, isSuperAdmin }: { branches: Branch[]; defaultBranchId: string | null; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "SISWA", branchId: defaultBranchId ?? "" });

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal membuat pengguna");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <UserPlus className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Pengguna</h1>
          <p className="text-sm text-gray-500">Buat akun pengguna baru</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap *</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Nama lengkap"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@contoh.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Password *</label>
          <div className="relative">
            <input
              required
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Minimal 8 karakter"
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Role *</label>
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {branches.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Cabang Default {isSuperAdmin ? "*" : ""}</label>
            <select
              value={form.branchId}
              onChange={(e) => update("branchId", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Pilih cabang</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/admin/users" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
