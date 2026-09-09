"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import Link from "next/link";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  defaultBranchId: string | null;
}

interface Branch { id: string; name: string; code: string }

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

const SUPER_ADMIN_ROLE = { value: "SUPER_ADMIN", label: "Super Admin" };

export default function EditUserClient({ user, isSelf, branches, isSuperAdmin }: { user: UserData; isSelf: boolean; branches: Branch[]; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
    isActive: user.isActive,
    branchId: user.defaultBranchId ?? "",
  });

  function update(k: string, v: unknown) { setForm((p) => ({ ...p, [k]: v })); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    startTransition(async () => {
      const payload: Record<string, unknown> = { name: form.name, email: form.email, role: form.role, isActive: form.isActive };
      if (form.password) payload.password = form.password;
      if (isSuperAdmin) payload.branchId = form.branchId;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Gagal menyimpan");
        return;
      }
      setSuccess("Perubahan berhasil disimpan");
      setForm((p) => ({ ...p, password: "" }));
    });
  }

  async function handleDeactivate() {
    if (!confirm("Nonaktifkan pengguna ini?")) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/users");
  }

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">{success}</p>}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap *</label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Password Baru <span className="text-gray-500">(kosongkan jika tidak diubah)</span></label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="Minimal 8 karakter"
            minLength={form.password ? 8 : 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Role *</label>
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {(isSuperAdmin || user.role === "SUPER_ADMIN") && (
              <option value={SUPER_ADMIN_ROLE.value}>{SUPER_ADMIN_ROLE.label}</option>
            )}
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <button
            type="button"
            onClick={() => update("isActive", !form.isActive)}
            className={`mt-0.5 rounded-lg px-4 py-2.5 text-sm font-medium border ${form.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
          >
            {form.isActive ? "Aktif" : "Nonaktif"}
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Cabang Default</label>
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

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {!isSelf && (
          <button
            type="button"
            onClick={handleDeactivate}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Nonaktifkan
          </button>
        )}
        <div className="ml-auto flex gap-3">
          <Link href="/admin/users" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan
          </button>
        </div>
      </div>
    </form>
  );
}
