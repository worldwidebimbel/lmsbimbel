"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
}

interface Props {
  eventId: string;
  isPaid: boolean;
  packages: Package[];
  onSuccess?: () => void;
}

export default function EventRegisterForm({ eventId, isPaid, packages, onSuccess }: Props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activePackages = packages.filter((p) => p.isActive);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/events/${eventId}/public-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        packageId: selectedPackage,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal mendaftar");
      setLoading(false);
      return;
    }

    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
      callbackUrl: `/events/${eventId}`,
    });

    if (signInRes?.ok) {
      onSuccess?.();
      window.location.href = `/events/${eventId}`;
    } else {
      setError("Akun berhasil dibuat tetapi gagal login otomatis. Silakan login manual.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama peserta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0812xxxxxxx"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimal 6 karakter"
          />
        </div>
      </div>

      {isPaid && activePackages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Paket</label>
          <div className="grid gap-3 md:grid-cols-2">
            {activePackages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg.id)}
                className={`text-left rounded-lg border p-4 transition-colors ${
                  selectedPackage === pkg.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{pkg.name}</span>
                  <span className="text-sm font-medium text-blue-600">{formatCurrency(pkg.price)}</span>
                </div>
                {pkg.description && <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={
          loading ||
          (isPaid && activePackages.length > 0 && !selectedPackage)
        }
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPaid ? "Daftar & Bayar" : "Daftar Sekarang"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Sudah punya akun?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Login di sini
        </a>
      </p>
    </form>
  );
}
