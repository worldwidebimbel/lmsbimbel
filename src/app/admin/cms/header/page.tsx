"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, RotateCcw, ExternalLink, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

const DEFAULTS: Record<string, string> = {
  header_type: "default",
  header_mainbar_mode: "light",
  header_show_topbar: "true",
  header_show_bottombar: "true",
  header_sticky: "true",
  header_width_mode: "full_width",
  header_mainbar_max_height: "80",
  header_topbar_bg: "#1e3a5f",
  header_topbar_text: "#ffffff",
  header_bottombar_bg: "#1e40af",
  header_bottombar_text: "#ffffff",
  header_menu_font_size: "14",
  header_menu_text: "#ffffff",
  header_menu_hover: "#eab308",
  header_menu_active: "#eab308",
  header_menu_hover_effect: "color",
  header_cta_bg: "#22c55e",
  header_cta_text: "#ffffff",
  header_whatsapp_bg: "#22c55e",
  header_whatsapp_text: "#ffffff",
};

interface MenuItem {
  id: string;
  label: string;
  href: string | null;
  parentId: string | null;
  order: number;
  openInNewTab: boolean;
  isActive: boolean;
  children: MenuItem[];
}

export default function AdminCmsHeaderPage() {
  const [cfg, setCfg] = useState<Record<string, string>>(DEFAULTS);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-config").then((r) => r.json()),
      fetch("/api/admin/cms/menus").then((r) => r.json()),
    ]).then(([config, menuData]) => {
      setCfg({ ...DEFAULTS, ...config });
      setMenus(menuData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function update(key: string, value: string) {
    setCfg((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function resetDefaults() {
    if (!confirm("Reset semua pengaturan header ke default?")) return;
    setCfg({ ...DEFAULTS });
  }

  async function moveMenu(id: string, direction: "up" | "down") {
    setReordering(true);
    await fetch(`/api/admin/cms/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    const data = await fetch("/api/admin/cms/menus").then((r) => r.json());
    setMenus(data);
    setReordering(false);
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  const isDefault = cfg.header_type === "default";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Header</h1>
          <p className="mt-1 text-sm text-gray-500">
            Konfigurasi tampilan header website. Tipe header aktif:{" "}
            <Link href="/admin/cms/settings" className="font-medium text-blue-600 hover:underline">
              {isDefault ? "Header Default" : "Header Simple"} (ubah di Homepage settings)
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <a
            href="/?view=public"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" /> Preview
          </a>
        </div>
      </div>

      {/* Layout Settings */}
      <Section title="Layout" description="Pengaturan tampilan dasar header">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Toggle
            label="Sticky Header"
            description="Header menempel di atas saat scroll"
            checked={cfg.header_sticky === "true"}
            onChange={(v) => update("header_sticky", v ? "true" : "false")}
          />
          {isDefault && (
            <>
              <Toggle
                label="Tampilkan Top Bar"
                description="Baris atas (social + link cepat)"
                checked={cfg.header_show_topbar === "true"}
                onChange={(v) => update("header_show_topbar", v ? "true" : "false")}
              />
              <Toggle
                label="Tampilkan Bottom Bar"
                description="Baris bawah (menu navigasi)"
                checked={cfg.header_show_bottombar === "true"}
                onChange={(v) => update("header_show_bottombar", v ? "true" : "false")}
              />
            </>
          )}
          <SelectField
            label="Width Mode"
            value={cfg.header_width_mode}
            onChange={(v) => update("header_width_mode", v)}
            options={[
              { value: "full_width", label: "Full Width (max-w-7xl, padding sisi)" },
              { value: "full_screen", label: "Full Screen (w-full, tanpa batas)" },
            ]}
          />
          <SelectField
            label="Mainbar Color Mode"
            value={cfg.header_mainbar_mode}
            onChange={(v) => update("header_mainbar_mode", v)}
            options={[
              { value: "light", label: "Light (putih/background terang)" },
              { value: "dark", label: "Dark (gelap/background biru)" },
            ]}
          />
          <NumberField
            label="Mainbar Max Height (px)"
            value={cfg.header_mainbar_max_height}
            onChange={(v) => update("header_mainbar_max_height", v)}
            min={40}
            max={200}
          />
        </div>
      </Section>

      {/* Colors - Top Bar (only for default) */}
      {isDefault && cfg.header_show_topbar === "true" && (
        <Section title="Top Bar Colors" description="Warna untuk baris paling atas">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ColorField label="Background" value={cfg.header_topbar_bg} onChange={(v) => update("header_topbar_bg", v)} />
            <ColorField label="Text" value={cfg.header_topbar_text} onChange={(v) => update("header_topbar_text", v)} />
          </div>
        </Section>
      )}

      {/* Mainbar Colors */}
      <Section title="Mainbar Colors" description="Warna untuk baris utama (logo + kontak/CTA)">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField
            label={cfg.header_mainbar_mode === "dark" ? "Background (Dark)" : "Background (Light)"}
            value={cfg.header_mainbar_mode === "dark" ? cfg.header_bottombar_bg : "#ffffff"}
            onChange={(v) => update("header_bottombar_bg", v)}
            disabled={cfg.header_mainbar_mode === "light"}
            hint={cfg.header_mainbar_mode === "light" ? "Mode Light: background selalu putih" : undefined}
          />
          <ColorField
            label="Text"
            value={cfg.header_mainbar_mode === "dark" ? "#ffffff" : "#1f2937"}
            onChange={() => {}}
            disabled
            hint="Mengikuti color mode"
          />
        </div>
      </Section>

      {/* Bottom Bar / Menu Colors */}
      <Section title="Menu & Bottom Bar Colors" description="Warna untuk baris menu navigasi">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ColorField label="Background" value={cfg.header_bottombar_bg} onChange={(v) => update("header_bottombar_bg", v)} />
          <ColorField label="Text Basic" value={cfg.header_menu_text} onChange={(v) => update("header_menu_text", v)} />
          <NumberField
            label="Font Size (px)"
            value={cfg.header_menu_font_size}
            onChange={(v) => update("header_menu_font_size", v)}
            min={10}
            max={24}
          />
          <ColorField label="Text Hover" value={cfg.header_menu_hover} onChange={(v) => update("header_menu_hover", v)} />
          <ColorField label="Text Active" value={cfg.header_menu_active} onChange={(v) => update("header_menu_active", v)} />
          <SelectField
            label="Efek Hover"
            value={cfg.header_menu_hover_effect}
            onChange={(v) => update("header_menu_hover_effect", v)}
            options={[
              { value: "color", label: "Color (ganti warna teks)" },
              { value: "background", label: "Background (ganti background)" },
              { value: "line", label: "Line (garis bawah)" },
            ]}
          />
        </div>
      </Section>

      {/* CTA & WhatsApp Buttons */}
      <Section title="Tombol CTA & WhatsApp" description="Warna tombol di header">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ColorField label="CTA Background" value={cfg.header_cta_bg} onChange={(v) => update("header_cta_bg", v)} />
          <ColorField label="CTA Text" value={cfg.header_cta_text} onChange={(v) => update("header_cta_text", v)} />
          <ColorField label="WhatsApp Background" value={cfg.header_whatsapp_bg} onChange={(v) => update("header_whatsapp_bg", v)} />
          <ColorField label="WhatsApp Text" value={cfg.header_whatsapp_text} onChange={(v) => update("header_whatsapp_text", v)} />
        </div>
      </Section>

      {/* Menu Builder - Reorder */}
      <Section title="Menu Builder" description="Susun urutan menu utama. Untuk tambah/edit/hapus menu detail, buka Menu Manager.">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Total: {menus.length} menu. Drag atau gunakan panah untuk mengubah urutan.
          </p>
          <Link
            href="/admin/cms/menu"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
          >
            Buka Menu Manager <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {menus.map((menu, idx) => (
            <div key={menu.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <GripVertical className="h-4 w-4 text-gray-300" />
              <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
              <div className="flex-1">
                <span className="font-semibold text-gray-900">{menu.label}</span>
                {menu.href && <span className="ml-2 text-xs text-gray-500">{menu.href}</span>}
                {menu.children.length > 0 && (
                  <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {menu.children.length} submenu
                  </span>
                )}
                {!menu.isActive && (
                  <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Nonaktif</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveMenu(menu.id, "up")}
                  disabled={reordering || idx === 0}
                  title="Naik"
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveMenu(menu.id, "down")}
                  disabled={reordering || idx === menus.length - 1}
                  title="Turun"
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {menus.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              Belum ada menu.{" "}
              <Link href="/admin/cms/menu" className="text-blue-600 hover:underline">Tambah menu di Menu Manager</Link>
            </div>
          )}
        </div>
      </Section>

      {/* Save Bar */}
      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-medium text-green-600">
            <Check className="h-4 w-4" /> Tersimpan
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          Perubahan langsung aktif di homepage setelah disimpan
        </span>
      </div>
    </div>
  );
}

// ===== Reusable Components =====

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-gray-200 p-3">
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative ml-3 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-9 w-12 cursor-pointer rounded border border-gray-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
