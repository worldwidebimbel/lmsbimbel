"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

interface UserData {
  id: string; name: string; email: string; phone: string | null;
  address: string | null; role: string; image: string | null;
}

export default function ProfileClient({ user }: { user: UserData }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(""); setError("");
    startTransition(async () => {
      const body: Record<string, string> = { name, phone, address };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Gagal memperbarui profil"); return; }
      setSuccess("Profil berhasil diperbarui!");
      setCurrentPassword(""); setNewPassword("");
    });
  }

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
          {user.image ? (
            <img src={user.image} alt={name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
              {initials}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900 text-lg">{name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input value={user.email} disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nomor HP</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Alamat</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
              placeholder="Alamat lengkap..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>

          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ganti Password</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password Lama</label>
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Kosongkan jika tidak ingin ubah"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password Baru</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 karakter"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
