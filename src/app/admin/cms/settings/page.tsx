"use client";

import { useState, useEffect } from "react";
import { Check, Monitor, Image as ImageIcon, Layout, Video, Layers, AlignJustify } from "lucide-react";

const HEADER_TYPES = [
  {
    value: "default",
    label: "Header Default",
    description: "Topbar + Mainbar + Bottombar (3 baris) — lengkap dengan info kontak & menu",
    icon: Layers,
    preview: (
      <div className="overflow-hidden rounded-md border border-gray-200">
        {/* Topbar */}
        <div className="flex items-center justify-between bg-blue-950 px-2 py-1">
          <div className="flex gap-1">
            <div className="h-1.5 w-3 rounded bg-white/30" />
            <div className="h-1.5 w-3 rounded bg-white/30" />
          </div>
          <div className="flex gap-1">
            <div className="h-1.5 w-6 rounded bg-yellow-400/70" />
            <div className="h-1.5 w-6 rounded bg-yellow-400/70" />
          </div>
        </div>
        {/* Mainbar */}
        <div className="flex items-center justify-between bg-white px-2 py-1.5">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-600" />
            <div className="h-1.5 w-12 rounded bg-gray-800" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-4 rounded bg-gray-200" />
            <div className="h-3 w-8 rounded bg-green-500" />
          </div>
        </div>
        {/* Bottombar */}
        <div className="flex items-center bg-blue-900 px-2 py-1.5">
          <div className="flex gap-1">
            <div className="h-1.5 w-6 rounded bg-white/80" />
            <div className="h-1.5 w-6 rounded bg-white/80" />
            <div className="h-1.5 w-6 rounded bg-white/80" />
          </div>
          <div className="ml-auto h-2 w-8 rounded bg-yellow-400" />
        </div>
      </div>
    ),
  },
  {
    value: "simple",
    label: "Header Simple",
    description: "Mainbar only — logo, menu utama, dan tombol CTA/WhatsApp (1 baris)",
    icon: AlignJustify,
    preview: (
      <div className="overflow-hidden rounded-md border border-gray-200">
        <div className="flex items-center justify-between bg-white px-2 py-2">
          <div className="flex items-center gap-1">
            <div className="h-3.5 w-3.5 rounded bg-blue-600" />
            <div className="h-2 w-12 rounded bg-gray-800" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-1.5 w-6 rounded bg-gray-700" />
              <div className="h-1.5 w-6 rounded bg-gray-700" />
              <div className="h-1.5 w-6 rounded bg-gray-700" />
            </div>
            <div className="h-3.5 w-10 rounded bg-green-500" />
          </div>
        </div>
      </div>
    ),
  },
];

const HERO_TYPES = [
  {
    value: "slider",
    label: "Banner Slider",
    description: "Gambar latar gelap + judul highlight kuning + auto-play slider",
    icon: ImageIcon,
    preview: (
      <div className="relative h-20 overflow-hidden rounded-md bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-center px-3">
          <div className="h-2 w-20 rounded bg-white/80" />
          <div className="mt-1 h-2 w-12 rounded bg-yellow-400" />
          <div className="mt-2 h-1.5 w-16 rounded bg-white/40" />
        </div>
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
          <div className="h-1 w-3 rounded bg-yellow-400" />
          <div className="h-1 w-1 rounded bg-white/50" />
          <div className="h-1 w-1 rounded bg-white/50" />
        </div>
      </div>
    ),
  },
  {
    value: "default",
    label: "Gradient + Kartu Fitur",
    description: "Gradient biru terang + tagline + kartu fitur di kanan",
    icon: Layout,
    preview: (
      <div className="flex h-20 overflow-hidden rounded-md bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex-1 p-3">
          <div className="h-1.5 w-12 rounded bg-blue-200" />
          <div className="mt-1.5 h-2.5 w-24 rounded bg-gray-800" />
          <div className="mt-1 h-2.5 w-16 rounded bg-blue-600" />
          <div className="mt-2 h-1.5 w-20 rounded bg-gray-300" />
          <div className="mt-2 flex gap-1">
            <div className="h-3 w-10 rounded bg-blue-600" />
            <div className="h-3 w-10 rounded border border-gray-200" />
          </div>
        </div>
        <div className="hidden w-20 p-2 sm:block">
          <div className="space-y-1.5 rounded bg-white p-1.5 shadow">
            <div className="flex items-center gap-1 rounded bg-blue-50 p-1">
              <div className="h-3 w-3 rounded bg-blue-400" />
              <div className="h-1.5 w-10 rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-1 rounded bg-green-50 p-1">
              <div className="h-3 w-3 rounded bg-green-400" />
              <div className="h-1.5 w-10 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "video",
    label: "Video Background",
    description: "Video latar full-width + overlay gelap + teks putih",
    icon: Video,
    preview: (
      <div className="relative h-20 overflow-hidden rounded-md bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-6 w-6 text-white/20" />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col justify-center px-3">
          <div className="h-2 w-20 rounded bg-white/80" />
          <div className="mt-1 h-2 w-14 rounded bg-yellow-400" />
          <div className="mt-2 h-1.5 w-16 rounded bg-white/40" />
        </div>
      </div>
    ),
  },
  {
    value: "split",
    label: "Split Layout",
    description: "Teks kiri + gambar kanan, layout 2 kolom",
    icon: Monitor,
    preview: (
      <div className="flex h-20 overflow-hidden rounded-md bg-white">
        <div className="flex-1 p-3">
          <div className="h-1.5 w-10 rounded bg-blue-200" />
          <div className="mt-1.5 h-2.5 w-20 rounded bg-gray-800" />
          <div className="mt-1 h-2.5 w-14 rounded bg-blue-600" />
          <div className="mt-2 h-1.5 w-18 rounded bg-gray-300" />
          <div className="mt-2 h-3 w-12 rounded bg-yellow-400" />
        </div>
        <div className="w-20 bg-gradient-to-br from-blue-200 to-indigo-200" />
      </div>
    ),
  },
];

export default function AdminCmsSettingsPage() {
  const [headerType, setHeaderType] = useState("default");
  const [heroType, setHeroType] = useState("slider");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data) => {
        if (data.header_type) setHeaderType(data.header_type);
        if (data.hero_type) setHeroType(data.hero_type);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ header_type: headerType, hero_type: heroType }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Pengaturan Homepage</h1>

      {/* Header Type Selector */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Tipe Header</h2>
        <p className="mt-1 text-sm text-gray-500">Pilih tampilan header di atas hero section</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HEADER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = headerType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setHeaderType(type.value)}
                className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="border-b border-gray-100 bg-gray-50 p-2">
                  {type.preview}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                    <span className={`text-sm font-bold ${isSelected ? "text-blue-600" : "text-gray-900"}`}>
                      {type.label}
                    </span>
                    {isSelected && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Type Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Tipe Hero</h2>
        <p className="mt-1 text-sm text-gray-500">Pilih tampilan hero section di homepage</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = heroType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setHeroType(type.value)}
                className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Preview */}
                <div className="border-b border-gray-100 bg-gray-50 p-2">
                  {type.preview}
                </div>
                {/* Label */}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                    <span className={`text-sm font-bold ${isSelected ? "text-blue-600" : "text-gray-900"}`}>
                      {type.label}
                    </span>
                    {isSelected && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <Check className="h-4 w-4" /> Tersimpan
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
