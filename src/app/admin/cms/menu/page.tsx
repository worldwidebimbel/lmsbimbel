"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";

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

interface PageOption {
  href: string;
  label: string;
  group: string;
}

export default function AdminCmsMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cms/menus");
    const data = await res.json();
    setMenus(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(item: Partial<MenuItem> & { label: string }) {
    if (editing) {
      await fetch(`/api/admin/cms/menus/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } else {
      await fetch("/api/admin/cms/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus menu ini? Semua submenu juga akan dihapus.")) return;
    await fetch(`/api/admin/cms/menus/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Menu Navigasi</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tambah Menu
        </button>
      </div>

      {showForm && (
        <MenuForm
          item={editing}
          menus={menus}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="space-y-2">
        {menus.map((menu) => (
          <div key={menu.id} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                <span className="shrink-0 font-semibold text-gray-900">{menu.label}</span>
                {menu.href && <span className="break-all text-xs text-gray-500">{menu.href}</span>}
                {menu.children.length > 0 && <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{menu.children.length} submenu</span>}
                {!menu.isActive && <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Nonaktif</span>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => { setEditing(menu); setShowForm(true); }} title="Edit" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(menu.id)} title="Hapus" className="max-md:min-h-[44px] max-md:min-w-[44px] max-md:inline-flex max-md:items-center max-md:justify-center rounded p-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {menu.children.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                {menu.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between py-1.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2 pl-6">
                      <span className="shrink-0 text-sm text-gray-700">↳ {child.label}</span>
                      {child.href && <span className="break-all text-xs text-gray-500">{child.href}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => { setEditing(child); setShowForm(true); }} className="rounded p-1 text-gray-500 hover:bg-gray-200">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(child.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {menus.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            Belum ada menu. Klik "Tambah Menu" untuk membuat.
          </div>
        )}
      </div>
    </div>
  );
}

function MenuForm({
  item,
  menus,
  onSave,
  onCancel,
}: {
  item: MenuItem | null;
  menus: MenuItem[];
  onSave: (data: Partial<MenuItem> & { label: string }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(item?.label ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [parentId, setParentId] = useState(item?.parentId ?? "");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [openInNewTab, setOpenInNewTab] = useState(item?.openInNewTab ?? false);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [pageOptions, setPageOptions] = useState<PageOption[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    // Load landing pages & custom pages for picker
    Promise.all([
      fetch("/api/admin/landing-pages").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/custom-pages").then((r) => r.json()).catch(() => []),
    ]).then(([landingPages, customPages]) => {
      const options: PageOption[] = [
        // Static pages
        { href: "/", label: "Homepage", group: "Static" },
        { href: "/tentang", label: "Tentang Kami", group: "Static" },
        { href: "/faq", label: "FAQ", group: "Static" },
        { href: "/galeri", label: "Galeri", group: "Static" },
        { href: "/program", label: "Program", group: "Static" },
        { href: "/blog", label: "Blog", group: "Static" },
        { href: "/events", label: "Events", group: "Static" },
        { href: "/cabang", label: "Cabang", group: "Static" },
        { href: "/daftar", label: "Daftar (PPDB)", group: "Static" },
        { href: "/login", label: "Login", group: "Static" },
        // Landing pages (published only)
        ...(Array.isArray(landingPages) ? landingPages : [])
          .filter((p: { isPublished?: boolean }) => p.isPublished)
          .map((p: { slug: string; title: string }) => ({
            href: `/lp/${p.slug}`,
            label: `${p.title} (/lp/${p.slug})`,
            group: "Landing Pages",
          })),
        // Custom pages (published only)
        ...(Array.isArray(customPages) ? customPages : [])
          .filter((p: { isPublished?: boolean }) => p.isPublished)
          .map((p: { slug: string; title: string }) => ({
            href: `/p/${p.slug}`,
            label: `${p.title} (/p/${p.slug})`,
            group: "Custom Pages",
          })),
      ];
      setPageOptions(options);
    }).catch(() => {
      // Fallback: static pages only
      setPageOptions([
        { href: "/", label: "Homepage", group: "Static" },
        { href: "/tentang", label: "Tentang Kami", group: "Static" },
        { href: "/faq", label: "FAQ", group: "Static" },
        { href: "/galeri", label: "Galeri", group: "Static" },
        { href: "/program", label: "Program", group: "Static" },
        { href: "/blog", label: "Blog", group: "Static" },
        { href: "/events", label: "Events", group: "Static" },
        { href: "/cabang", label: "Cabang", group: "Static" },
        { href: "/daftar", label: "Daftar (PPDB)", group: "Static" },
        { href: "/login", label: "Login", group: "Static" },
      ]);
    });
  }, []);

  function pickPage(opt: PageOption) {
    setHref(opt.href);
    // Auto-fill label if empty
    if (!label.trim()) {
      setLabel(opt.label.replace(/\s*\(\/.*\)\s*$/, "").toUpperCase());
    }
    setShowPicker(false);
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-4 font-semibold text-gray-900">{item ? "Edit Menu" : "Tambah Menu"}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Label *</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="HOME" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">URL (href)</label>
          <input value={href} onChange={(e) => setHref(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="/ atau /tentang" />
          <button
            type="button"
            onClick={() => setShowPicker((p) => !p)}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            {showPicker ? "Tutup picker" : "Pilih dari daftar halaman"}
          </button>
          {showPicker && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 text-sm">
              {["Static", "Landing Pages", "Custom Pages"].map((group) => {
                const opts = pageOptions.filter((o) => o.group === group);
                if (opts.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <div className="px-2 py-1 text-xs font-bold uppercase text-gray-400">{group}</div>
                    {opts.map((opt) => (
                      <button
                        key={opt.href}
                        type="button"
                        onClick={() => pickPage(opt)}
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-blue-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Parent Menu</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Tidak ada (top level) —</option>
            {menus.filter((m) => m.id !== item?.id).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Urutan</label>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} />
          Buka di tab baru
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Aktif
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onSave({ label, href: href || null, parentId: parentId || null, order, openInNewTab, isActive })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Simpan
        </button>
        <button onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Batal
        </button>
      </div>
    </div>
  );
}
